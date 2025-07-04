const { pool } = require("../database");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  handleError,
} = require("../utils/errors");
const { JOB_STATUSES, DATABASE, VALIDATION } = require("../config/constants");

/**
 * Job Repository - Handles all database operations for jobs
 * Implements repository pattern with proper parameterization, query builders,
 * connection pooling, transaction support, and optimized queries
 */
class JobRepository {
  constructor() {
    this.tableName = DATABASE.TABLES.JOBS;
    this.updatesTableName = DATABASE.TABLES.JOB_UPDATES;
    this.customersTableName = DATABASE.TABLES.CUSTOMERS;
    this.usersTableName = DATABASE.TABLES.USERS;
    this.technicianLocationsTableName = DATABASE.TABLES.TECHNICIAN_LOCATIONS;
    this.sharedRoutesTableName = "shared_routes";
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

    if (filters.status) {
      conditions.push(`j.status = $${++paramIndex}`);
      params.push(filters.status);
    }

    if (filters.statuses && Array.isArray(filters.statuses)) {
      const placeholders = filters.statuses
        .map(() => `$${++paramIndex}`)
        .join(", ");
      conditions.push(`j.status IN (${placeholders})`);
      params.push(...filters.statuses);
    }

    if (filters.assigned_to) {
      conditions.push(`j.assigned_to = $${++paramIndex}`);
      params.push(filters.assigned_to);
    }

    if (filters.customer_id) {
      conditions.push(`j.customer_id = $${++paramIndex}`);
      params.push(filters.customer_id);
    }

    if (filters.priority) {
      conditions.push(`j.priority = $${++paramIndex}`);
      params.push(filters.priority);
    }

    if (filters.scheduled_date) {
      conditions.push(
        `(j.scheduled_date = $${++paramIndex} OR j.scheduled_date IS NULL)`
      );
      params.push(filters.scheduled_date);
    }

    if (filters.date_range) {
      conditions.push(
        `j.scheduled_date BETWEEN $${++paramIndex} AND $${++paramIndex}`
      );
      params.push(filters.date_range.start, filters.date_range.end);
    }

    if (filters.search) {
      conditions.push(
        `(j.title ILIKE $${++paramIndex} OR j.description ILIKE $${++paramIndex})`
      );
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.has_coordinates !== undefined) {
      if (filters.has_coordinates) {
        conditions.push(`c.latitude IS NOT NULL AND c.longitude IS NOT NULL`);
      } else {
        conditions.push(`(c.latitude IS NULL OR c.longitude IS NULL)`);
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
  buildOrderClause(sortBy = "last_activity", sortOrder = "DESC") {
    const validSortFields = [
      "id",
      "title",
      "status",
      "scheduled_date",
      "scheduled_time",
      "last_activity",
      "created_at",
      "route_order",
      "customer_name",
    ];

    const validSortOrders = ["ASC", "DESC"];

    const field = validSortFields.includes(sortBy) ? sortBy : "last_activity";
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
   * Find all jobs with relations and filters
   */
  async findAllWithRelations(
    filters = {},
    pagination = {},
    sortBy = "last_activity",
    sortOrder = "DESC"
  ) {
    try {
      const { whereClause, params: whereParams } =
        this.buildWhereClause(filters);
      const orderClause = this.buildOrderClause(sortBy, sortOrder);
      const { limitClause, params: paginationParams } =
        this.buildPaginationClause(pagination, whereParams.length);

      const query = `
        SELECT 
          j.*, 
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address,
          c.latitude,
          c.longitude,
          u.name as technician_name,
          u.role as technician_role,
          COUNT(ju.id) as update_count,
          MAX(ju.created_at) as last_update
        FROM ${this.tableName} j 
        LEFT JOIN ${this.customersTableName} c ON j.customer_id = c.id 
        LEFT JOIN ${this.usersTableName} u ON j.assigned_to = u.id
        LEFT JOIN ${this.updatesTableName} ju ON j.id = ju.job_id
        ${whereClause}
        GROUP BY j.id, c.name, c.email, c.phone, c.address, c.latitude, c.longitude, u.name, u.role
        ${orderClause}
        ${limitClause}
      `;

      const allParams = [...whereParams, ...paginationParams];
      const result = await pool.query(query, allParams);

      return {
        success: true,
        data: result.rows,
        total: result.rows.length,
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 50,
          hasMore: result.rows.length === (pagination.limit || 50),
        },
      };
    } catch (error) {
      console.error("Find all jobs with relations error:", error);
      return {
        success: false,
        error: "Failed to retrieve jobs",
        details: error.message,
      };
    }
  }

  /**
   * Find job by ID with all related details
   */
  async findByIdWithDetails(id) {
    try {
      const query = `
        SELECT 
          j.*, 
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address,
          c.latitude,
          c.longitude,
          u.name as technician_name,
          u.role as technician_role,
          u.email as technician_email
        FROM ${this.tableName} j 
        LEFT JOIN ${this.customersTableName} c ON j.customer_id = c.id 
        LEFT JOIN ${this.usersTableName} u ON j.assigned_to = u.id
        WHERE j.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError("Job not found", "job");
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
   * Create a new job with transaction support
   */
  async create(data, userId) {
    const client = await this.beginTransaction();

    try {
      const result = await this.createWithTransaction(client, data, userId);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Create a new job using an existing transaction
   */
  async createWithTransaction(client, data, userId) {
    const {
      title,
      description,
      customer_id,
      status = DATABASE.DEFAULTS.JOB_STATUS,
      assigned_to,
      scheduled_date,
      scheduled_time,
      estimated_duration = DATABASE.DEFAULTS.JOB_ESTIMATED_DURATION,
    } = data;

    // Validate required fields
    if (!title) {
      throw new ValidationError("Job title is required", "title");
    }

    if (!customer_id) {
      throw new ValidationError("Customer ID is required", "customer_id");
    }

    // Create the job
    const jobQuery = `
      INSERT INTO ${this.tableName} (
        title, description, customer_id, status, assigned_to, 
        scheduled_date, scheduled_time, estimated_duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;

    const jobResult = await client.query(jobQuery, [
      title,
      description,
      customer_id,
      status,
      assigned_to,
      scheduled_date,
      scheduled_time,
      estimated_duration,
    ]);

    const newJob = jobResult.rows[0];

    // Create initial job update
    const updateQuery = `
      INSERT INTO ${this.updatesTableName} (job_id, user_id, content, update_type) 
      VALUES ($1, $2, $3, $4)
    `;

    await client.query(updateQuery, [
      newJob.id,
      userId,
      "Job created",
      "creation",
    ]);

    return {
      success: true,
      data: newJob,
    };
  }

  /**
   * Update job and log changes with transaction support
   */
  async updateAndLog(id, data, userId) {
    const client = await this.beginTransaction();

    try {
      // Get current job state
      const currentJobResult = await client.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (currentJobResult.rows.length === 0) {
        throw new NotFoundError("Job not found", "job");
      }

      const oldJob = currentJobResult.rows[0];
      const {
        title,
        description,
        customer_id,
        status,
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration,
      } = data;

      // Update the job
      const updateQuery = `
        UPDATE ${this.tableName} SET 
          title = $1, 
          description = $2, 
          customer_id = $3, 
          status = $4, 
          assigned_to = $5, 
          scheduled_date = $6,
          scheduled_time = $7,
          estimated_duration = $8,
          last_activity = CURRENT_TIMESTAMP 
        WHERE id = $9 
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        title,
        description,
        customer_id,
        status,
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration,
        id,
      ]);

      const updatedJob = updateResult.rows[0];

      // Create automatic updates for changes
      const updates = [];

      if (oldJob.status !== status) {
        const statusUpdateQuery = `
          INSERT INTO ${this.updatesTableName} (job_id, user_id, content, update_type) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *
        `;

        const statusUpdateResult = await client.query(statusUpdateQuery, [
          id,
          userId,
          `Status changed from ${oldJob.status} to ${status}`,
          "status_change",
        ]);
        updates.push(statusUpdateResult.rows[0]);
      }

      if (oldJob.assigned_to !== assigned_to) {
        let content;
        if (!oldJob.assigned_to && assigned_to) {
          const techResult = await client.query(
            `SELECT name FROM ${this.usersTableName} WHERE id = $1`,
            [assigned_to]
          );
          content = `Job assigned to ${
            techResult.rows[0]?.name || "technician"
          }`;
        } else if (oldJob.assigned_to && !assigned_to) {
          content = "Job unassigned";
        } else {
          const techResult = await client.query(
            `SELECT name FROM ${this.usersTableName} WHERE id = $1`,
            [assigned_to]
          );
          content = `Job reassigned to ${
            techResult.rows[0]?.name || "technician"
          }`;
        }

        const assignmentUpdateQuery = `
          INSERT INTO ${this.updatesTableName} (job_id, user_id, content, update_type) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *
        `;

        const assignmentUpdateResult = await client.query(
          assignmentUpdateQuery,
          [id, userId, content, "assignment"]
        );
        updates.push(assignmentUpdateResult.rows[0]);
      }

      await this.commitTransaction(client);

      return {
        success: true,
        data: {
          job: updatedJob,
          updates: updates,
        },
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      console.error("Update and log job error:", error);
      return {
        success: false,
        error: error.message || "Failed to update job",
      };
    }
  }

  /**
   * Delete job with transaction support
   */
  async delete(id) {
    const client = await this.beginTransaction();

    try {
      const result = await client.query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError("Job not found", "job");
      }

      await this.commitTransaction(client);

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Get job updates with user information
   */
  async getJobUpdates(jobId, pagination = {}) {
    try {
      const { limitClause, params: paginationParams } =
        this.buildPaginationClause(pagination, 1);

      const query = `
        SELECT 
          ju.*,
          u.name as user_name,
          u.role as user_role,
          u.email as user_email
        FROM ${this.updatesTableName} ju
        JOIN ${this.usersTableName} u ON ju.user_id = u.id
        WHERE ju.job_id = $1
        ORDER BY ju.created_at DESC
        ${limitClause}
      `;

      const result = await pool.query(query, [jobId, ...paginationParams]);

      return {
        success: true,
        data: result.rows,
        total: result.rows.length,
      };
    } catch (error) {
      console.error("Get job updates error:", error);
      return {
        success: false,
        error: "Failed to retrieve job updates",
        details: error.message,
      };
    }
  }

  /**
   * Create job update
   */
  async createJobUpdate(jobId, data, userId) {
    const client = await this.beginTransaction();

    try {
      const { 
        content, 
        update_type = "comment", 
        note_type = "general",
        is_private = false,
        is_pinned = false
      } = data;

      if (!content) {
        throw new ValidationError("Update content is required", "content");
      }

      // Create the update with enhanced note fields
      const updateQuery = `
        INSERT INTO ${this.updatesTableName} 
        (job_id, user_id, content, update_type, note_type, is_private, is_pinned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        jobId,
        userId,
        content,
        update_type,
        note_type,
        is_private,
        is_pinned,
      ]);

      // Update job's last_activity timestamp
      await client.query(
        `UPDATE ${this.tableName} SET last_activity = CURRENT_TIMESTAMP WHERE id = $1`,
        [jobId]
      );

      // Get user info for the response
      const userResult = await client.query(
        `SELECT name, role FROM ${this.usersTableName} WHERE id = $1`,
        [userId]
      );

      const updateWithUser = {
        ...updateResult.rows[0],
        user_name: userResult.rows[0].name,
        user_role: userResult.rows[0].role,
      };

      await this.commitTransaction(client);

      return {
        success: true,
        data: updateWithUser,
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.code === "23503") {
        // Foreign key constraint violation
        throw new NotFoundError("Job not found", "job");
      }
      throw error;
    }
  }

  /**
   * Get single job update by ID
   */
  async getJobUpdateById(updateId) {
    try {
      const query = `
        SELECT ju.*, u.name as user_name, u.role as user_role
        FROM ${this.updatesTableName} ju
        JOIN ${this.usersTableName} u ON ju.user_id = u.id
        WHERE ju.id = $1
      `;

      const result = await pool.query(query, [updateId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          data: null,
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Get job update by ID error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update job note
   */
  async updateJobNote(updateId, data, userId) {
    const client = await this.beginTransaction();

    try {
      const { content, note_type, is_private } = data;
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (content !== undefined) {
        fields.push(`content = $${paramIndex++}`);
        values.push(content);
      }

      if (note_type !== undefined) {
        fields.push(`note_type = $${paramIndex++}`);
        values.push(note_type);
      }

      if (is_private !== undefined) {
        fields.push(`is_private = $${paramIndex++}`);
        values.push(is_private);
      }

      fields.push(`edited_at = CURRENT_TIMESTAMP`);
      fields.push(`edited_by = $${paramIndex++}`);
      values.push(userId);

      values.push(updateId);

      const updateQuery = `
        UPDATE ${this.updatesTableName}
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new NotFoundError("Job update not found", "update");
      }

      // Get user info for the response
      const userResult = await client.query(
        `SELECT name, role FROM ${this.usersTableName} WHERE id = $1`,
        [result.rows[0].user_id]
      );

      const updateWithUser = {
        ...result.rows[0],
        user_name: userResult.rows[0].name,
        user_role: userResult.rows[0].role,
      };

      await this.commitTransaction(client);

      return {
        success: true,
        data: updateWithUser,
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Delete job note
   */
  async deleteJobNote(updateId) {
    try {
      const query = `
        DELETE FROM ${this.updatesTableName}
        WHERE id = $1
        RETURNING id
      `;

      const result = await pool.query(query, [updateId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Job update not found",
        };
      }

      return {
        success: true,
        data: { id: result.rows[0].id },
      };
    } catch (error) {
      console.error("Delete job note error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Toggle note pin status
   */
  async toggleNotePin(updateId, isPinned) {
    try {
      const query = `
        UPDATE ${this.updatesTableName}
        SET is_pinned = $1
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [isPinned, updateId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Job update not found",
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Toggle note pin error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get jobs for map data with location information
   */
  async getJobsMapData(filters = {}) {
    try {
      const { whereClause, params } = this.buildWhereClause(filters);

      const query = `
        SELECT 
          j.*,
          c.name as customer_name,
          c.address as customer_address,
          c.latitude,
          c.longitude,
          u.name as technician_name
        FROM ${this.tableName} j
        LEFT JOIN ${this.customersTableName} c ON j.customer_id = c.id
        LEFT JOIN ${this.usersTableName} u ON j.assigned_to = u.id
        ${whereClause}
        ORDER BY j.route_order NULLS LAST, j.scheduled_time
      `;

      const result = await pool.query(query, params);

      // Separate jobs with and without coordinates
      const jobsWithCoords = result.rows.filter(
        (job) => job.latitude && job.longitude
      );
      const jobsWithoutCoords = result.rows.filter(
        (job) => !job.latitude || !job.longitude
      );

      return {
        success: true,
        data: {
          jobs: result.rows,
          jobs_with_coordinates: jobsWithCoords.length,
          jobs_without_coordinates: jobsWithoutCoords.length,
          warning:
            jobsWithoutCoords.length > 0
              ? `${jobsWithoutCoords.length} job(s) missing coordinates. Use "Force Geocode" to update them.`
              : null,
        },
      };
    } catch (error) {
      console.error("Get map data error:", error);
      return {
        success: false,
        error: "Failed to retrieve map data",
        details: error.message,
      };
    }
  }

  /**
   * Update route order for jobs
   */
  async updateRouteOrder(jobId, routeOrder) {
    try {
      const result = await pool.query(
        `UPDATE ${this.tableName} SET route_order = $1 WHERE id = $2 RETURNING *`,
        [routeOrder, jobId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Job not found",
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error("Update route order error:", error);
      return {
        success: false,
        error: "Failed to update route order",
        details: error.message,
      };
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM ${this.tableName}) as total_jobs,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE status = '${JOB_STATUSES.PENDING}') as pending_jobs,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE status = '${JOB_STATUSES.IN_PROGRESS}') as in_progress_jobs,
          (SELECT COUNT(*) FROM ${this.tableName} WHERE status = '${JOB_STATUSES.COMPLETED}') as completed_jobs,
          (SELECT COUNT(*) FROM ${this.customersTableName}) as total_customers,
          (SELECT COUNT(DISTINCT assigned_to) FROM ${this.tableName} WHERE assigned_to IS NOT NULL) as active_technicians
      `;

      const result = await pool.query(statsQuery);

      return {
        success: true,
        data: {
          totalJobs: parseInt(result.rows[0].total_jobs),
          pendingJobs: parseInt(result.rows[0].pending_jobs),
          inProgressJobs: parseInt(result.rows[0].in_progress_jobs),
          completedJobs: parseInt(result.rows[0].completed_jobs),
          totalCustomers: parseInt(result.rows[0].total_customers),
          activeTechnicians: parseInt(result.rows[0].active_technicians),
        },
      };
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return {
        success: false,
        error: "Failed to retrieve dashboard statistics",
        details: error.message,
      };
    }
  }

  /**
   * Get jobs by technician
   */
  async getJobsByTechnician(technicianId, filters = {}) {
    try {
      const baseFilters = { ...filters, assigned_to: technicianId };
      return await this.findAllWithRelations(baseFilters);
    } catch (error) {
      console.error("Get jobs by technician error:", error);
      return {
        success: false,
        error: "Failed to retrieve technician jobs",
        details: error.message,
      };
    }
  }

  /**
   * Get jobs by customer
   */
  async getJobsByCustomer(customerId, filters = {}) {
    try {
      const baseFilters = { ...filters, customer_id: customerId };
      return await this.findAllWithRelations(baseFilters);
    } catch (error) {
      console.error("Get jobs by customer error:", error);
      return {
        success: false,
        error: "Failed to retrieve customer jobs",
        details: error.message,
      };
    }
  }

  /**
   * Search jobs with full-text search
   */
  async searchJobs(searchTerm, filters = {}) {
    try {
      const searchFilters = { ...filters, search: searchTerm };
      return await this.findAllWithRelations(searchFilters);
    } catch (error) {
      console.error("Search jobs error:", error);
      return {
        success: false,
        error: "Failed to search jobs",
        details: error.message,
      };
    }
  }

  /**
   * Get jobs count by status
   */
  async getJobsCountByStatus() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY status
        ORDER BY count DESC
      `;

      const result = await pool.query(query);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Get jobs count by status error:", error);
      return {
        success: false,
        error: "Failed to retrieve job counts",
        details: error.message,
      };
    }
  }

  /**
   * Get recent job activity
   */
  async getRecentActivity(limit = 10) {
    try {
      const query = `
        SELECT 
          ju.*,
          j.title as job_title,
          j.status as job_status,
          u.name as user_name,
          u.role as user_role
        FROM ${this.updatesTableName} ju
        JOIN ${this.tableName} j ON ju.job_id = j.id
        JOIN ${this.usersTableName} u ON ju.user_id = u.id
        ORDER BY ju.created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Get recent activity error:", error);
      return {
        success: false,
        error: "Failed to retrieve recent activity",
        details: error.message,
      };
    }
  }

  /**
   * Bulk update job statuses
   */
  async bulkUpdateStatus(jobIds, newStatus, userId) {
    const client = await this.beginTransaction();

    try {
      const placeholders = jobIds.map((_, index) => `$${index + 2}`).join(", ");

      const updateQuery = `
        UPDATE ${this.tableName} 
        SET status = $1, last_activity = CURRENT_TIMESTAMP 
        WHERE id IN (${placeholders})
        RETURNING *
      `;

      const result = await client.query(updateQuery, [newStatus, ...jobIds]);

      // Create bulk update log
      const logQuery = `
        INSERT INTO ${this.updatesTableName} (job_id, user_id, content, update_type)
        VALUES ($1, $2, $3, $4)
      `;

      for (const jobId of jobIds) {
        await client.query(logQuery, [
          jobId,
          userId,
          `Status updated to ${newStatus} (bulk update)`,
          "bulk_status_change",
        ]);
      }

      await this.commitTransaction(client);

      return {
        success: true,
        data: {
          updatedJobs: result.rows,
          count: result.rows.length,
        },
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      console.error("Bulk update status error:", error);
      return {
        success: false,
        error: "Failed to bulk update job statuses",
        details: error.message,
      };
    }
  }

  /**
   * Get jobs with missing coordinates
   */
  async getJobsWithMissingCoordinates() {
    try {
      const query = `
        SELECT 
          j.*,
          c.name as customer_name,
          c.address as customer_address
        FROM ${this.tableName} j
        LEFT JOIN ${this.customersTableName} c ON j.customer_id = c.id
        WHERE (c.latitude IS NULL OR c.longitude IS NULL)
        AND c.address IS NOT NULL
        ORDER BY j.scheduled_date ASC, j.scheduled_time ASC
      `;

      const result = await pool.query(query);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Get jobs with missing coordinates error:", error);
      return {
        success: false,
        error: "Failed to retrieve jobs with missing coordinates",
        details: error.message,
      };
    }
  }

  /**
   * Get jobs for route optimization
   */
  async getJobsForRouteOptimization(filters = {}) {
    try {
      const baseFilters = {
        ...filters,
        statuses: [JOB_STATUSES.PENDING, JOB_STATUSES.IN_PROGRESS],
        has_coordinates: true,
      };

      return await this.getJobsMapData(baseFilters);
    } catch (error) {
      console.error("Get jobs for route optimization error:", error);
      return {
        success: false,
        error: "Failed to retrieve jobs for route optimization",
        details: error.message,
      };
    }
  }

  /**
   * Get jobs scheduled for today
   * @returns {Promise<Object>} Response object with today's jobs
   */
  async getTodaysJobs() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const query = `
        SELECT 
          j.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          c.address as customer_address,
          u.name as technician_name,
          u.email as technician_email
        FROM ${this.tableName} j
        LEFT JOIN ${this.customersTableName} c ON j.customer_id = c.id
        LEFT JOIN ${this.usersTableName} u ON j.assigned_to = u.id
        WHERE j.scheduled_date = $1
        ORDER BY j.scheduled_time ASC, j.created_at ASC
      `;

      const result = await pool.query(query, [today]);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Get today's jobs error:", error);
      return {
        success: false,
        error: "Failed to retrieve today's jobs",
        details: error.message,
      };
    }
  }

  /**
   * Get technician availability status
   * @returns {Promise<Object>} Response object with technician availability
   */
  async getTechnicianAvailability() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COALESCE(job_stats.active_jobs, 0) as active_jobs,
          COALESCE(job_stats.today_jobs, 0) as today_jobs,
          CASE 
            WHEN COALESCE(job_stats.active_jobs, 0) = 0 THEN 'available'
            WHEN COALESCE(job_stats.active_jobs, 0) >= 3 THEN 'busy'
            ELSE 'partially_available'
          END as status,
          job_stats.current_job_id,
          job_stats.current_job_title,
          job_stats.next_scheduled_time
        FROM ${this.usersTableName} u
        LEFT JOIN (
          SELECT 
            assigned_to,
            COUNT(CASE WHEN status IN ('${JOB_STATUSES.PENDING}', '${JOB_STATUSES.IN_PROGRESS}') THEN 1 END) as active_jobs,
            COUNT(CASE WHEN scheduled_date = '${today}' THEN 1 END) as today_jobs,
            MIN(CASE WHEN status = '${JOB_STATUSES.IN_PROGRESS}' THEN id END) as current_job_id,
            MIN(CASE WHEN status = '${JOB_STATUSES.IN_PROGRESS}' THEN title END) as current_job_title,
            MIN(CASE WHEN scheduled_date = '${today}' AND status = '${JOB_STATUSES.PENDING}' 
                THEN scheduled_time END) as next_scheduled_time
          FROM ${this.tableName}
          WHERE assigned_to IS NOT NULL
          GROUP BY assigned_to
        ) job_stats ON u.id = job_stats.assigned_to
        WHERE u.role = 'technician'
        ORDER BY u.name ASC
      `;

      const result = await pool.query(query);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error("Get technician availability error:", error);
      return {
        success: false,
        error: "Failed to retrieve technician availability",
        details: error.message,
      };
    }
  }
}

// Create singleton instance
const jobRepository = new JobRepository();
module.exports = jobRepository;
