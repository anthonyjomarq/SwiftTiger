const { pool } = require("../database");
const bcrypt = require("bcryptjs");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  handleError,
} = require("../utils/errors");
const { USER_ROLES, DATABASE, PERMISSIONS } = require("../config/constants");

/**
 * User Repository - Handles all database operations for users
 * Implements repository pattern with proper parameterization, query builders,
 * connection pooling, transaction support, and optimized queries
 */
class UserRepository {
  constructor() {
    this.tableName = DATABASE.TABLES.USERS;
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
   * Find all users with optional filters
   */
  async findAll(filters = {}) {
    try {
      let query = `SELECT id, name, email, role, created_at, updated_at FROM ${this.tableName}`;
      const params = [];

      if (filters.role) {
        query += ` WHERE role = $1`;
        params.push(filters.role);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const query = `SELECT id, name, email, role, created_at, updated_at FROM ${this.tableName} WHERE id = $1`;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError("User not found", "user");
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
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        throw new NotFoundError("User not found", "user");
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
   * Create a new user
   */
  async create(userData) {
    const client = await this.beginTransaction();

    try {
      const {
        email,
        password,
        name,
        role = DATABASE.DEFAULTS.USER_ROLE,
      } = userData;

      // Validation
      if (!email || !password || !name) {
        throw new ValidationError(
          "Email, password, and name are required",
          "email/password/name"
        );
      }

      // Check if user already exists
      const existingUser = await client.query(
        `SELECT id FROM ${this.tableName} WHERE email = $1`,
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new ConflictError("User already exists", "email");
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Check if this is the first user (make them admin)
      const userCount = await client.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      const isFirstUser = parseInt(userCount.rows[0].count) === 0;
      const finalRole = isFirstUser ? USER_ROLES.ADMIN : role;

      const query = `
        INSERT INTO ${this.tableName} (name, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, email, role, created_at, updated_at
      `;

      const result = await client.query(query, [
        name,
        email,
        hashedPassword,
        finalRole,
      ]);

      await this.commitTransaction(client);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      if (error.code === "23505") {
        // Unique constraint violation
        throw new ConflictError("User already exists", "email");
      }
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async update(id, updateData) {
    const client = await this.beginTransaction();

    try {
      const { email, name, role } = updateData;

      // Check if user exists
      const existingUser = await client.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (existingUser.rows.length === 0) {
        throw new NotFoundError("User not found", "user");
      }

      // Check if email is being changed and if it already exists
      if (email && email !== existingUser.rows[0].email) {
        const emailCheck = await client.query(
          `SELECT id FROM ${this.tableName} WHERE email = $1 AND id != $2`,
          [email, id]
        );

        if (emailCheck.rows.length > 0) {
          throw new ConflictError("Email already in use", "email");
        }
      }

      const query = `
        UPDATE ${this.tableName}
        SET name = $1, email = $2, role = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING id, name, email, role, created_at, updated_at
      `;

      const result = await client.query(query, [name, email, role, id]);

      await this.commitTransaction(client);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      if (error.code === "23505") {
        // Unique constraint violation
        throw new ConflictError("Email already in use", "email");
      }
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async delete(id) {
    const client = await this.beginTransaction();

    try {
      // Check if user has associated jobs
      const jobsCheck = await client.query(
        "SELECT COUNT(*) as job_count FROM jobs WHERE assigned_to = $1",
        [id]
      );

      if (parseInt(jobsCheck.rows[0].job_count) > 0) {
        throw new ConflictError(
          "Cannot delete user with assigned jobs",
          "jobs"
        );
      }

      const result = await client.query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id, name, email, role`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError("User not found", "user");
      }

      await this.commitTransaction(client);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(id, currentPassword, newPassword) {
    const client = await this.beginTransaction();

    try {
      // Get current user with password
      const userResult = await client.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError("User not found", "user");
      }

      const user = userResult.rows[0];

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        throw new ValidationError(
          "Current password is incorrect",
          "currentPassword"
        );
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await client.query(
        `UPDATE ${this.tableName} SET password = $1, updated_at = NOW() WHERE id = $2`,
        [hashedNewPassword, id]
      );

      await this.commitTransaction(client);

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Get user permissions
   */
  async getPermissions(userId) {
    try {
      const query = `SELECT role FROM ${this.tableName} WHERE id = $1`;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new NotFoundError("User not found", "user");
      }

      const role = result.rows[0].role;
      const permissions = this.getPermissionsByRole(role);

      return {
        success: true,
        data: {
          role,
          permissions,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Get permissions by role
   */
  getPermissionsByRole(role) {
    const permissions = {
      [USER_ROLES.ADMIN]: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_EDIT,
        PERMISSIONS.USERS_DELETE,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.CUSTOMERS_DELETE,
        PERMISSIONS.JOBS_VIEW,
        PERMISSIONS.JOBS_CREATE,
        PERMISSIONS.JOBS_EDIT,
        PERMISSIONS.JOBS_DELETE,
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.ROUTES_VIEW,
      ],
      [USER_ROLES.MANAGER]: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.JOBS_VIEW,
        PERMISSIONS.JOBS_CREATE,
        PERMISSIONS.JOBS_EDIT,
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.ROUTES_VIEW,
      ],
      [USER_ROLES.TECHNICIAN]: [
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.JOBS_VIEW_ASSIGNED,
        PERMISSIONS.JOBS_EDIT,
        PERMISSIONS.JOBS_UPDATE_STATUS,
      ],
    };

    return permissions[role] || [];
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    try {
      const query = `SELECT id, name, email, role, created_at FROM ${this.tableName} WHERE role = $1 ORDER BY name`;
      const result = await pool.query(query, [role]);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search users
   */
  async search(searchTerm) {
    try {
      const query = `
        SELECT id, name, email, role, created_at 
        FROM ${this.tableName} 
        WHERE name ILIKE $1 OR email ILIKE $1 
        ORDER BY name
      `;
      const result = await pool.query(query, [`%${searchTerm}%`]);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStats() {
    try {
      const totalUsers = await pool.query(
        `SELECT COUNT(*) as total FROM ${this.tableName}`
      );
      const usersByRole = await pool.query(
        `SELECT role, COUNT(*) as count FROM ${this.tableName} GROUP BY role`
      );

      return {
        success: true,
        data: {
          totalUsers: parseInt(totalUsers.rows[0].total),
          usersByRole: usersByRole.rows.reduce((acc, row) => {
            acc[row.role] = parseInt(row.count);
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();
