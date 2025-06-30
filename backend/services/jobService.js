const { pool } = require("../database");
const socketService = require("./socketService");
const { hasPermission } = require("../middleware/permissions");
const jobRepository = require("../repositories/jobRepository");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  internalServerErrorResponse,
} = require("../utils/apiResponse");

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
        return notFoundResponse("User");
      }

      const currentUserRole = userResult.rows[0].role;

      // Check permissions based on role
      if (currentUserRole === "technician") {
        if (!hasPermission(currentUserRole, "jobs.view_assigned")) {
          return forbiddenResponse();
        }
      } else {
        if (!hasPermission(currentUserRole, "jobs.view")) {
          return forbiddenResponse();
        }
      }

      // Build filters based on user role
      const filters = {};
      if (currentUserRole === "technician") {
        filters.assigned_to = userId;
      }

      // Use repository to get jobs
      const result = await jobRepository.findAllWithRelations(filters);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { jobs: result.data },
        "Jobs retrieved successfully"
      );
    } catch (error) {
      console.error("Get jobs error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get a specific job by ID with proper permissions
   */
  async getJobById(jobId, userId, userRole) {
    try {
      const result = await jobRepository.findByIdWithDetails(jobId);

      if (!result.success) {
        return notFoundResponse("Job");
      }

      const job = result.data;

      // Check permissions for technicians
      if (userRole === "technician" && job.assigned_to !== userId) {
        return forbiddenResponse();
      }

      return successResponse({ job }, "Job retrieved successfully");
    } catch (error) {
      console.error("Get job by ID error:", error);
      return internalServerErrorResponse();
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
        return errorResponse("Job title is required", 400);
      }

      // Prepare job data for repository
      const jobDataForRepo = {
        title,
        description,
        customer_id,
        status: status || "pending",
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration: estimated_duration || 60,
      };

      // Use repository to create job
      const result = await jobRepository.create(jobDataForRepo, userId);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      const newJob = result.data;

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

      return successResponse(newJob, "Job created successfully", 201);
    } catch (error) {
      console.error("Create job error:", error);
      return internalServerErrorResponse();
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
      const currentJobResult = await jobRepository.findByIdWithDetails(jobId);
      if (!currentJobResult.success) {
        return notFoundResponse("Job");
      }

      const oldJob = currentJobResult.data;

      // Get user's current role from database
      const userResult = await pool.query(
        "SELECT role FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length === 0) {
        return notFoundResponse("User");
      }

      const currentUserRole = userResult.rows[0].role;

      // Check permissions
      if (currentUserRole === "technician") {
        if (oldJob.assigned_to !== userId) {
          return errorResponse("You can only edit jobs assigned to you", 403);
        }
        if (assigned_to !== oldJob.assigned_to) {
          return errorResponse("Technicians cannot change job assignment", 403);
        }
      } else {
        if (!hasPermission(currentUserRole, "jobs.edit")) {
          return forbiddenResponse();
        }
      }

      // Prepare update data for repository
      const updateDataForRepo = {
        title,
        description,
        customer_id,
        status,
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration,
      };

      // Use repository to update job
      const result = await jobRepository.updateAndLog(
        jobId,
        updateDataForRepo,
        userId
      );

      if (!result.success) {
        return internalServerErrorResponse();
      }

      const updatedJob = result.data;

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

      return successResponse(updatedJob, "Job updated successfully");
    } catch (error) {
      console.error("Update job error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Delete a job with proper permissions
   */
  async deleteJob(jobId, userId) {
    try {
      const result = await jobRepository.delete(jobId);

      if (!result.success) {
        return notFoundResponse("Job");
      }

      // Emit WebSocket event for job deletion
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(jobId, null, userId);
        await socketService.logActivity(userId, "job_delete", {
          jobId: jobId,
          title: result.data.title,
        });
      }

      return successResponse(
        { message: "Job deleted successfully" },
        "Job deleted successfully"
      );
    } catch (error) {
      console.error("Delete job error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get job updates with proper permissions
   */
  async getJobUpdates(jobId, userId, userRole) {
    try {
      // Check if user has permission to view this job
      const jobCheck = await jobRepository.findByIdWithDetails(jobId);

      if (!jobCheck.success) {
        return notFoundResponse("Job");
      }

      const job = jobCheck.data;

      // Technicians can only see updates for their assigned jobs
      if (userRole === "technician" && job.assigned_to !== userId) {
        return forbiddenResponse();
      }

      const result = await jobRepository.getJobUpdates(jobId);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { updates: result.data },
        "Job updates retrieved successfully"
      );
    } catch (error) {
      console.error("Get job updates error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Create a job update with proper permissions
   */
  async createJobUpdate(jobId, updateData, userId, userRole) {
    try {
      const { content, update_type = "comment" } = updateData;

      if (!content) {
        return errorResponse("Update content is required", 400);
      }

      // Check if user has permission to update this job
      const jobCheck = await jobRepository.findByIdWithDetails(jobId);

      if (!jobCheck.success) {
        return notFoundResponse("Job");
      }

      const job = jobCheck.data;

      // Technicians can only update their assigned jobs
      if (userRole === "technician" && job.assigned_to !== userId) {
        return forbiddenResponse();
      }

      // Use repository to create job update
      const result = await jobRepository.createJobUpdate(
        jobId,
        { content, update_type },
        userId
      );

      if (!result.success) {
        return internalServerErrorResponse();
      }

      // Emit WebSocket event for new update
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(jobId, null, userId);
        await socketService.logActivity(userId, "job_update_comment", {
          jobId: jobId,
          updateId: result.data.id,
        });
      }

      return successResponse(
        result.data,
        "Job update created successfully",
        201
      );
    } catch (error) {
      console.error("Create job update error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get jobs with location data for mapping
   */
  async getJobsMapData(userId, userRole, filters = {}) {
    try {
      const { date, technician_id } = filters;

      // Build filters for repository
      const repoFilters = {
        statuses: ["pending", "in_progress"],
      };

      if (date) {
        repoFilters.scheduled_date = date;
      }

      if (technician_id) {
        repoFilters.assigned_to = technician_id;
      }

      // For technicians, only show their jobs
      if (userRole === "technician") {
        repoFilters.assigned_to = userId;
      }

      // Use repository to get jobs
      const result = await jobRepository.getJobsMapData(repoFilters);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      // Separate jobs with and without coordinates
      const jobsWithCoords = result.data.filter(
        (job) => job.latitude && job.longitude
      );
      const jobsWithoutCoords = result.data.filter(
        (job) => !job.latitude || !job.longitude
      );

      return successResponse(
        {
          jobs: result.data,
          jobs_with_coordinates: jobsWithCoords.length,
          jobs_without_coordinates: jobsWithoutCoords.length,
          warning:
            jobsWithoutCoords.length > 0
              ? `${jobsWithoutCoords.length} job(s) missing coordinates. Use "Force Geocode" to update them.`
              : null,
        },
        "Map data retrieved successfully"
      );
    } catch (error) {
      console.error("Get map data error:", error);
      return internalServerErrorResponse();
    }
  }
}

// Create singleton instance
const jobService = new JobService();
module.exports = jobService;
