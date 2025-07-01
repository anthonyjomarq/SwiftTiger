/**
 * Job Service
 * Handles business logic for job management, including CRUD operations,
 * permissions, and real-time updates
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */

// Database and middleware
const { pool } = require("../database");
const { hasPermission } = require("../middleware/permissions");

// Repositories
const jobRepository = require("../repositories/jobRepository");

// Services
const socketService = require("./socketService");

// Utilities
const { handleError } = require("../utils/errors");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  internalServerErrorResponse,
} = require("../utils/apiResponse");

// Configuration
const { JOB_STATUSES, USER_ROLES, DATABASE } = require("../config/constants");

/**
 * JobService class for managing job operations
 */
class JobService {
  /**
   * Initialize JobService instance
   */
  constructor() {}

  /**
   * Get all jobs with proper permissions and role-based filtering
   *
   * @param {number} userId - ID of the requesting user
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Object>} Response object with jobs data
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

      return successResponse(
        { jobs: result.data },
        "Jobs retrieved successfully"
      );
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Get a specific job by ID with proper permissions
   *
   * @param {number} jobId - ID of the job to retrieve
   * @param {number} userId - ID of the requesting user
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Object>} Response object with job data
   */
  async getJobById(jobId, userId, userRole) {
    try {
      const result = await jobRepository.findByIdWithDetails(jobId);
      const job = result.data;

      // Check permissions for technicians
      if (userRole === USER_ROLES.TECHNICIAN && job.assigned_to !== userId) {
        return forbiddenResponse();
      }

      return successResponse({ job }, "Job retrieved successfully");
    } catch (error) {
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 404
        ? notFoundResponse("Job")
        : errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Create a new job with validation and WebSocket emissions
   *
   * @param {Object} jobData - Job data object
   * @param {string} jobData.title - Job title
   * @param {string} jobData.description - Job description
   * @param {number} jobData.customer_id - Customer ID
   * @param {string} jobData.status - Job status
   * @param {number} jobData.assigned_to - Assigned technician ID
   * @param {string} jobData.scheduled_date - Scheduled date
   * @param {string} jobData.scheduled_time - Scheduled time
   * @param {number} jobData.estimated_duration - Estimated duration in minutes
   * @param {number} userId - ID of the user creating the job
   * @returns {Promise<Object>} Response object with created job data
   */
  async createJob(jobData, userId) {
    const client = await jobRepository.beginTransaction();

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

      // Prepare job data for repository
      const jobDataForRepo = {
        title,
        description,
        customer_id,
        status: status || DATABASE.DEFAULTS.JOB_STATUS,
        assigned_to,
        scheduled_date,
        scheduled_time,
        estimated_duration:
          estimated_duration || DATABASE.DEFAULTS.JOB_ESTIMATED_DURATION,
      };

      // Create job using repository (this handles the job creation and initial update)
      const result = await jobRepository.createWithTransaction(
        client,
        jobDataForRepo,
        userId
      );
      const newJob = result.data;

      // Log activity in transaction
      if (socketService.getHandlers()) {
        await socketService.logActivityWithTransaction(
          client,
          userId,
          "job_create",
          {
            jobId: newJob.id,
            title: title,
          }
        );

        // Send notification to assigned technician in transaction
        if (assigned_to) {
          await socketService.sendNotificationWithTransaction(
            client,
            assigned_to,
            "New Job Assignment",
            `You have been assigned to a new job: ${title}`,
            "job_assignment",
            { jobId: newJob.id }
          );
        }
      }

      await jobRepository.commitTransaction(client);

      // Emit WebSocket events after successful commit (non-critical operations)
      if (socketService.getHandlers()) {
        // Broadcast new job to all connected users
        socketService.broadcastJobUpdate(newJob.id, newJob, userId);
      }

      return successResponse(newJob, "Job created successfully", 201);
    } catch (error) {
      await jobRepository.rollbackTransaction(client);
      const errorResponse = handleError(error);
      return errorResponse.statusCode === 500
        ? internalServerErrorResponse()
        : errorResponse(errorResponse.error, errorResponse.statusCode);
    }
  }

  /**
   * Update an existing job with validation and WebSocket emissions
   *
   * @param {number} jobId - ID of the job to update
   * @param {Object} updateData - Job update data
   * @param {number} userId - ID of the user updating the job
   * @param {string} userRole - Role of the user updating the job
   * @returns {Promise<Object>} Response object with updated job data
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
      if (currentUserRole === USER_ROLES.TECHNICIAN) {
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
   *
   * @param {number} jobId - ID of the job to delete
   * @param {number} userId - ID of the user deleting the job
   * @returns {Promise<Object>} Response object with deletion confirmation
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
   *
   * @param {number} jobId - ID of the job to get updates for
   * @param {number} userId - ID of the requesting user
   * @param {string} userRole - Role of the requesting user
   * @returns {Promise<Object>} Response object with job updates
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
      if (userRole === USER_ROLES.TECHNICIAN && job.assigned_to !== userId) {
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
   *
   * @param {number} jobId - ID of the job to create update for
   * @param {Object} updateData - Update data object
   * @param {string} updateData.content - Update content
   * @param {string} updateData.update_type - Type of update (default: "comment")
   * @param {number} userId - ID of the user creating the update
   * @param {string} userRole - Role of the user creating the update
   * @returns {Promise<Object>} Response object with created update data
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
      if (userRole === USER_ROLES.TECHNICIAN && job.assigned_to !== userId) {
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
   *
   * @param {number} userId - ID of the requesting user
   * @param {string} userRole - Role of the requesting user
   * @param {Object} filters - Optional filters for job data
   * @param {string} filters.date - Filter by scheduled date
   * @param {number} filters.technician_id - Filter by assigned technician
   * @returns {Promise<Object>} Response object with map data
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
      if (userRole === USER_ROLES.TECHNICIAN) {
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

/**
 * Create singleton instance of JobService
 */
const jobService = new JobService();

/**
 * Export JobService singleton instance
 */
module.exports = jobService;
