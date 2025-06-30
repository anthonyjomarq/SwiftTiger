const { pool } = require("../database");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  handleError,
} = require("../utils/errors");

/**
 * Customer Repository - Handles all database operations for customers
 * Implements repository pattern with proper parameterization, query builders,
 * connection pooling, transaction support, and optimized queries
 */
class CustomerRepository {
  constructor() {
    this.tableName = "customers";
  }

  /**
   * Get database connection from pool
   */
  getConnection() {
    return pool;
  }

  /**
   * Begin a database transaction
   */
  async beginTransaction() {
    const client = await pool.connect();
    await client.query("BEGIN");
    return client;
  }

  /**
   * Commit a database transaction
   */
  async commitTransaction(client) {
    await client.query("COMMIT");
    client.release();
  }

  /**
   * Rollback a database transaction
   */
  async rollbackTransaction(client) {
    await client.query("ROLLBACK");
    client.release();
  }

  /**
   * Build WHERE clause for filters
   */
  buildWhereClause(filters = {}, paramOffset = 0) {
    const conditions = [];
    const params = [];
    let paramIndex = paramOffset;

    if (filters.search) {
      conditions.push(
        `(name ILIKE $${++paramIndex} OR email ILIKE $${++paramIndex} OR phone ILIKE $${++paramIndex})`
      );
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.has_coordinates !== undefined) {
      if (filters.has_coordinates) {
        conditions.push(`latitude IS NOT NULL AND longitude IS NOT NULL`);
      } else {
        conditions.push(`(latitude IS NULL OR longitude IS NULL)`);
      }
    }

    if (filters.has_jobs !== undefined) {
      if (filters.has_jobs) {
        conditions.push(
          `EXISTS (SELECT 1 FROM jobs WHERE customer_id = customers.id)`
        );
      } else {
        conditions.push(
          `NOT EXISTS (SELECT 1 FROM jobs WHERE customer_id = customers.id)`
        );
      }
    }

    return {
      whereClause:
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  /**
   * Build ORDER BY clause
   */
  buildOrderClause(sortBy = "created_at", sortOrder = "DESC") {
    const validSortFields = [
      "id",
      "name",
      "email",
      "phone",
      "address",
      "created_at",
      "updated_at",
    ];

    const validSortOrders = ["ASC", "DESC"];

    const field = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const order = validSortOrders.includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    return `ORDER BY ${field} ${order}`;
  }

  /**
   * Build pagination clause
   */
  buildPaginationClause(pagination = {}, paramOffset = 0) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    return {
      limitClause: `LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}`,
      params: [limit, offset],
    };
  }

  /**
   * Find all customers with optional filters and pagination
   */
  async findAll(filters = {}, pagination = {}) {
    try {
      const { whereClause, params: whereParams } =
        this.buildWhereClause(filters);
      const orderClause = this.buildOrderClause();
      const { limitClause, params: paginationParams } =
        this.buildPaginationClause(pagination, whereParams.length);

      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `;

      const allParams = [...whereParams, ...paginationParams];
      const result = await pool.query(query, allParams);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find customer by ID
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError("Customer not found", "customer");
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async create(data) {
    try {
      const { name, email, phone, address } = data;

      // Validation
      if (!name || !email) {
        throw new ValidationError("Name and email are required", "name/email");
      }

      const query = `
        INSERT INTO ${this.tableName} (name, email, phone, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [name, email, phone, address]);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        throw new ConflictError(
          "Customer with this email already exists",
          "email"
        );
      }
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async update(id, data) {
    try {
      const { name, email, phone, address } = data;

      // Validation
      if (!name || !email) {
        throw new ValidationError("Name and email are required", "name/email");
      }

      const query = `
        UPDATE ${this.tableName}
        SET name = $1, email = $2, phone = $3, address = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;

      const result = await pool.query(query, [name, email, phone, address, id]);

      if (result.rows.length === 0) {
        throw new NotFoundError("Customer not found", "customer");
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (error.code === "23505") {
        // Unique constraint violation
        throw new ConflictError(
          "Customer with this email already exists",
          "email"
        );
      }
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  async delete(id) {
    try {
      // Check if customer has associated jobs
      const jobsCheck = await pool.query(
        "SELECT COUNT(*) as job_count FROM jobs WHERE customer_id = $1",
        [id]
      );

      if (parseInt(jobsCheck.rows[0].job_count) > 0) {
        throw new ConflictError(
          "Cannot delete customer with associated jobs",
          "jobs"
        );
      }

      const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError("Customer not found", "customer");
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Find customer by email
   */
  async findByEmail(email) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        throw new NotFoundError("Customer not found", "customer");
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Update customer coordinates
   */
  async updateCoordinates(id, lat, lng) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET latitude = $1, longitude = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [lat, lng, id]);

      if (result.rows.length === 0) {
        throw new NotFoundError("Customer not found", "customer");
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getStats() {
    try {
      const totalCustomers = await pool.query(
        `SELECT COUNT(*) as total FROM ${this.tableName}`
      );
      const customersWithJobs = await pool.query(
        `SELECT COUNT(DISTINCT customer_id) as total FROM jobs WHERE customer_id IS NOT NULL`
      );
      const customersWithCoordinates = await pool.query(
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
      );

      return {
        success: true,
        data: {
          totalCustomers: parseInt(totalCustomers.rows[0].total),
          customersWithJobs: parseInt(customersWithJobs.rows[0].total),
          customersWithCoordinates: parseInt(
            customersWithCoordinates.rows[0].total
          ),
        },
      };
    } catch (error) {
      console.error("Get customer stats error:", error);
      return {
        success: false,
        error: "Failed to retrieve customer statistics",
      };
    }
  }

  /**
   * Search customers by name or email
   */
  async search(searchTerm) {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE name ILIKE $1 OR email ILIKE $1
        ORDER BY name
      `;

      const result = await pool.query(query, [`%${searchTerm}%`]);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Search customers error:", error);
      return {
        success: false,
        error: "Failed to search customers",
      };
    }
  }
}

// Create singleton instance
const customerRepository = new CustomerRepository();
module.exports = customerRepository;
