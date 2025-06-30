const { pool } = require("../database");
const socketService = require("./socketService");
const { hasPermission } = require("../middleware/permissions");

class JobService {
  constructor() {}

  /**
   * Get all jobs with proper permissions and role-based filtering
   */
  async getJobs(userId, userRole) {
    try {
      // Validate user exists and get current role
      const userResult = await pool.query(
        "SELECT role FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      const currentUserRole = userResult.rows[0].role;

      // Check permissions based on role
      if (currentUserRole === "technician") {
        if (!hasPermission(currentUserRole, "jobs.view_assigned")) {
          return {
            success: false,
            error: "Insufficient permissions",
            statusCode: 403,
          };
        }
      } else {
        if (!hasPermission(currentUserRole, "jobs.view")) {
          return {
            success: false,
            error: "Insufficient permissions",
            statusCode: 403,
          };
        }
      }

      let query;
      let params = [];

      // Technicians only see their assigned jobs
      if (currentUserRole === "technician") {
        query = `
          SELECT 
            j.*, 
            c.name as customer_name,
            COUNT(ju.id) as update_count,
            MAX(ju.created_at) as last_update
          FROM jobs j 
          LEFT JOIN customers c ON j.customer_id = c.id 
          LEFT JOIN job_updates ju ON j.id = ju.job_id
          WHERE j.assigned_to = $1
          GROUP BY j.id, c.name
          ORDER BY j.last_activity DESC
        `;
        params = [userId];
      } else {
        query = `
          SELECT 
            j.*, 
            c.name as customer_name,
            COUNT(ju.id) as update_count,
            MAX(ju.created_at) as last_update
          FROM jobs j 
          LEFT JOIN customers c ON j.customer_id = c.id 
          LEFT JOIN job_updates ju ON j.id = ju.job_id
          GROUP BY j.id, c.name
          ORDER BY j.last_activity DESC
        `;
      }

      const result = await pool.query(query, params);

      return {
        success: true,
        data: { jobs: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get jobs error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get a specific job by ID with proper permissions
   */
  async getJobById(jobId, userId, userRole) {
    try {
      const result = await pool.query(
        `SELECT 
          j.*, 
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address,
          c.latitude,
          c.longitude,
          u.name as technician_name
        FROM jobs j 
        LEFT JOIN customers c ON j.customer_id = c.id 
        LEFT JOIN users u ON j.assigned_to = u.id
        WHERE j.id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Job not found",
          statusCode: 404,
        };
      }

      const job = result.rows[0];

      // Check permissions for technicians
      if (userRole === "technician" && job.assigned_to !== userId) {
        return {
          success: false,
          error: "Access denied",
          statusCode: 403,
        };
      }

      return {
        success: true,
        data: { job },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get job by ID error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Create a new job with validation and WebSocket emissions
   */
  async createJob(jobData, userId) {
    try {
      const {
        title,
        description,
        customer_id,
        status,
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration,
      } = jobData;

      // Validation
      if (!title) {
        return {
          success: false,
          error: "Job title is required",
          statusCode: 400,
        };
      }

      // Create the job
      const result = await pool.query(
        `INSERT INTO jobs (
          title, description, customer_id, status, assigned_to, 
          scheduled_date, scheduled_time, estimated_duration
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          title,
          description,
          customer_id,
          status || "pending",
          assigned_to,
          scheduled_date,
          scheduled_time,
          estimated_duration || 60,
        ]
      );

      const newJob = result.rows[0];

      // Create initial job update
      await pool.query(
        "INSERT INTO job_updates (job_id, user_id, content, update_type) VALUES ($1, $2, $3, $4)",
        [newJob.id, userId, "Job created", "creation"]
      );

      // Emit WebSocket events
      if (socketService.getHandlers()) {
        // Broadcast new job to all connected users
        socketService.broadcastJobUpdate(newJob.id, newJob, userId);

        // Log activity
        await socketService.logActivity(userId, "job_create", {
          jobId: newJob.id,
          title: title,
        });

        // Send notification to assigned technician
        if (assigned_to) {
          await socketService.sendNotification(
            assigned_to,
            "New Job Assignment",
            `You have been assigned to a new job: ${title}`,
            "job_assignment",
            { jobId: newJob.id }
          );
        }
      }

      return {
        success: true,
        data: newJob,
        statusCode: 201,
      };
    } catch (error) {
      console.error("Create job error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Update an existing job with validation and WebSocket emissions
   */
  async updateJob(jobId, updateData, userId, userRole) {
    try {
      const {
        title,
        description,
        customer_id,
        status,
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration,
      } = updateData;

      // Get current job state
      const currentJob = await pool.query("SELECT * FROM jobs WHERE id = $1", [
        jobId,
      ]);
      if (currentJob.rows.length === 0) {
        return {
          success: false,
          error: "Job not found",
          statusCode: 404,
        };
      }

      const oldJob = currentJob.rows[0];

      // Get user's current role from database
      const userResult = await pool.query(
        "SELECT role FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      const currentUserRole = userResult.rows[0].role;

      // Check permissions
      if (currentUserRole === "technician") {
        if (oldJob.assigned_to !== userId) {
          return {
            success: false,
            error: "You can only edit jobs assigned to you",
            statusCode: 403,
          };
        }
        if (assigned_to !== oldJob.assigned_to) {
          return {
            success: false,
            error: "Technicians cannot change job assignment",
            statusCode: 403,
          };
        }
      } else {
        if (!hasPermission(currentUserRole, "jobs.edit")) {
          return {
            success: false,
            error: "Insufficient permissions",
            statusCode: 403,
          };
        }
      }

      // Update the job
      const result = await pool.query(
        `UPDATE jobs SET 
          title = $1, 
          description = $2, 
          customer_id = $3, 
          status = $4, 
          assigned_to = $5, 
          scheduled_date = $6,
          scheduled_time = $7,
          estimated_duration = $8,
          last_activity = CURRENT_TIMESTAMP 
        WHERE id = $9 RETURNING *`,
        [
          title,
          description,
          customer_id,
          status,
          assigned_to,
          scheduled_date,
          scheduled_time,
          estimated_duration,
          jobId,
        ]
      );

      const updatedJob = result.rows[0];

      // Create automatic updates for changes
      const updates = [];

      if (oldJob.status !== status) {
        const updateResult = await pool.query(
          "INSERT INTO job_updates (job_id, user_id, content, update_type) VALUES ($1, $2, $3, $4) RETURNING *",
          [
            jobId,
            userId,
            `Status changed from ${oldJob.status} to ${status}`,
            "status_change",
          ]
        );
        updates.push(updateResult.rows[0]);
      }

      if (oldJob.assigned_to !== assigned_to) {
        let content;
        if (!oldJob.assigned_to && assigned_to) {
          const tech = await pool.query(
            "SELECT name FROM users WHERE id = $1",
            [assigned_to]
          );
          content = `Job assigned to ${tech.rows[0]?.name || "technician"}`;
        } else if (oldJob.assigned_to && !assigned_to) {
          content = "Job unassigned";
        } else {
          const tech = await pool.query(
            "SELECT name FROM users WHERE id = $1",
            [assigned_to]
          );
          content = `Job reassigned to ${tech.rows[0]?.name || "technician"}`;
        }

        const updateResult = await pool.query(
          "INSERT INTO job_updates (job_id, user_id, content, update_type) VALUES ($1, $2, $3, $4) RETURNING *",
          [jobId, userId, content, "assignment"]
        );
        updates.push(updateResult.rows[0]);
      }

      // Emit WebSocket events
      if (socketService.getHandlers()) {
        // Broadcast job update to all connected users
        socketService.broadcastJobUpdate(jobId, updatedJob, userId);

        // Log activity
        await socketService.logActivity(userId, "job_update", {
          jobId: jobId,
          changes: {
            status:
              oldJob.status !== status
                ? { from: oldJob.status, to: status }
                : undefined,
            assigned_to:
              oldJob.assigned_to !== assigned_to
                ? { from: oldJob.assigned_to, to: assigned_to }
                : undefined,
          },
        });

        // Send notifications
        if (assigned_to && assigned_to !== oldJob.assigned_to) {
          await socketService.sendNotification(
            assigned_to,
            "New Job Assignment",
            `You have been assigned to job: ${title}`,
            "job_assignment",
            { jobId: jobId }
          );
        }
      }

      return {
        success: true,
        data: updatedJob,
        statusCode: 200,
      };
    } catch (error) {
      console.error("Update job error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Delete a job with proper permissions
   */
  async deleteJob(jobId, userId) {
    try {
      const result = await pool.query(
        "DELETE FROM jobs WHERE id = $1 RETURNING *",
        [jobId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Job not found",
          statusCode: 404,
        };
      }

      // Emit WebSocket event for job deletion
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(jobId, null, userId);
        await socketService.logActivity(userId, "job_delete", {
          jobId: jobId,
          title: result.rows[0].title,
        });
      }

      return {
        success: true,
        data: { message: "Job deleted successfully" },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Delete job error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get job updates with proper permissions
   */
  async getJobUpdates(jobId, userId, userRole) {
    try {
      // Check if user has permission to view this job
      const jobCheck = await pool.query("SELECT * FROM jobs WHERE id = $1", [
        jobId,
      ]);

      if (jobCheck.rows.length === 0) {
        return {
          success: false,
          error: "Job not found",
          statusCode: 404,
        };
      }

      const job = jobCheck.rows[0];

      // Technicians can only see updates for their assigned jobs
      if (userRole === "technician" && job.assigned_to !== userId) {
        return {
          success: false,
          error: "Access denied",
          statusCode: 403,
        };
      }

      const updates = await pool.query(
        `SELECT 
          ju.*,
          u.name as user_name,
          u.role as user_role
        FROM job_updates ju
        JOIN users u ON ju.user_id = u.id
        WHERE ju.job_id = $1
        ORDER BY ju.created_at DESC`,
        [jobId]
      );

      return {
        success: true,
        data: { updates: updates.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get job updates error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Create a job update with proper permissions
   */
  async createJobUpdate(jobId, updateData, userId, userRole) {
    try {
      const { content, update_type = "comment" } = updateData;

      if (!content) {
        return {
          success: false,
          error: "Update content is required",
          statusCode: 400,
        };
      }

      // Check if user has permission to update this job
      const jobCheck = await pool.query("SELECT * FROM jobs WHERE id = $1", [
        jobId,
      ]);

      if (jobCheck.rows.length === 0) {
        return {
          success: false,
          error: "Job not found",
          statusCode: 404,
        };
      }

      const job = jobCheck.rows[0];

      // Technicians can only update their assigned jobs
      if (userRole === "technician" && job.assigned_to !== userId) {
        return {
          success: false,
          error: "Access denied",
          statusCode: 403,
        };
      }

      // Create the update
      const newUpdate = await pool.query(
        `INSERT INTO job_updates (job_id, user_id, content, update_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [jobId, userId, content, update_type]
      );

      // Update job's last_activity timestamp
      await pool.query(
        "UPDATE jobs SET last_activity = CURRENT_TIMESTAMP WHERE id = $1",
        [jobId]
      );

      // Get user info for the response
      const userInfo = await pool.query(
        "SELECT name, role FROM users WHERE id = $1",
        [userId]
      );

      const updateWithUser = {
        ...newUpdate.rows[0],
        user_name: userInfo.rows[0].name,
        user_role: userInfo.rows[0].role,
      };

      // Emit WebSocket event for new update
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(jobId, null, userId);
        await socketService.logActivity(userId, "job_update_comment", {
          jobId: jobId,
          updateId: newUpdate.rows[0].id,
        });
      }

      return {
        success: true,
        data: updateWithUser,
        statusCode: 201,
      };
    } catch (error) {
      console.error("Create job update error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get jobs with location data for mapping
   */
  async getJobsMapData(userId, userRole, filters = {}) {
    try {
      const { date, technician_id } = filters;

      let query = `
        SELECT 
          j.*,
          c.name as customer_name,
          c.address as customer_address,
          c.latitude,
          c.longitude,
          u.name as technician_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN users u ON j.assigned_to = u.id
        WHERE j.status IN ('pending', 'in_progress')
      `;

      const params = [];

      if (date) {
        query += ` AND (j.scheduled_date = $${
          params.length + 1
        } OR j.scheduled_date IS NULL)`;
        params.push(date);
      }

      if (technician_id) {
        query += ` AND j.assigned_to = $${params.length + 1}`;
        params.push(technician_id);
      }

      // For technicians, only show their jobs
      if (userRole === "technician") {
        query += ` AND j.assigned_to = $${params.length + 1}`;
        params.push(userId);
      }

      query += " ORDER BY j.route_order NULLS LAST, j.scheduled_time";

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
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get map data error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }
}

// Create singleton instance
const jobService = new JobService();
module.exports = jobService;
