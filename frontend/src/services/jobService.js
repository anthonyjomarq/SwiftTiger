import BaseApi from "./baseApi.js";
import { API_ENDPOINTS } from "../config/constants";

/**
 * @typedef {Object} JobData
 * @property {string} title - Job title
 * @property {string} description - Job description
 * @property {string} customerId - Associated customer ID
 * @property {string} status - Job status (pending, in_progress, completed, cancelled)
 * @property {string} priority - Job priority (low, medium, high, urgent)
 * @property {Date} scheduledDate - Scheduled date for the job
 * @property {string} [location] - Job location
 * @property {Object} [coordinates] - Job coordinates {lat, lng}
 * @property {string} [assignedTechnician] - Assigned technician ID
 * @property {string} [notes] - Additional notes
 */

/**
 * @typedef {Object} JobUpdateData
 * @property {string} [title] - Job title
 * @property {string} [description] - Job description
 * @property {string} [status] - Job status
 * @property {string} [priority] - Job priority
 * @property {Date} [scheduledDate] - Scheduled date
 * @property {string} [location] - Job location
 * @property {Object} [coordinates] - Job coordinates
 * @property {string} [assignedTechnician] - Assigned technician ID
 * @property {string} [notes] - Additional notes
 */

/**
 * @typedef {Object} JobStatusUpdate
 * @property {string} status - New job status
 * @property {string} [notes] - Status update notes
 */

/**
 * @typedef {Object} JobFilters
 * @property {string} [status] - Filter by job status
 * @property {string} [priority] - Filter by job priority
 * @property {string} [assignedTechnician] - Filter by assigned technician
 * @property {string} [customerId] - Filter by customer ID
 * @property {Date} [startDate] - Filter jobs from this date
 * @property {Date} [endDate] - Filter jobs until this date
 * @property {string} [search] - Search in title and description
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {string} [sortOrder] - Sort order (asc, desc)
 */

/**
 * Job service for handling job-related API operations
 * @class JobService
 * @extends BaseApi
 */
class JobService extends BaseApi {
  /**
   * Create a new JobService instance
   * @param {Object} config - Configuration for the API instance
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Get all jobs with optional filtering and pagination
   * @param {JobFilters} params - Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated list of jobs
   * @throws {Error} When job retrieval fails
   */
  async getAll(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.JOBS.LIST,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific job by ID
   * @param {string} id - Job ID
   * @returns {Promise<Object>} Job details
   * @throws {Error} When job retrieval fails
   */
  async getById(id) {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.JOBS.GET.replace(":id", id),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new job
   * @param {JobData} jobData - Job data to create
   * @returns {Promise<Object>} Created job details
   * @throws {Error} When job creation fails
   */
  async create(jobData) {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.JOBS.CREATE,
        data: jobData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing job
   * @param {string} id - Job ID
   * @param {JobUpdateData} jobData - Updated job data
   * @returns {Promise<Object>} Updated job details
   * @throws {Error} When job update fails
   */
  async update(id, jobData) {
    try {
      const response = await this.request({
        method: "PUT",
        url: API_ENDPOINTS.JOBS.UPDATE.replace(":id", id),
        data: jobData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a job
   * @param {string} id - Job ID
   * @returns {Promise<Object>} Deletion confirmation
   * @throws {Error} When job deletion fails
   */
  async delete(id) {
    try {
      const response = await this.request({
        method: "DELETE",
        url: API_ENDPOINTS.JOBS.DELETE.replace(":id", id),
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update job status
   * @param {string} id - Job ID
   * @param {JobStatusUpdate} statusData - Status update data
   * @returns {Promise<Object>} Updated job details
   * @throws {Error} When status update fails
   */
  async updateStatus(id, statusData) {
    try {
      const response = await this.request({
        method: "PATCH",
        url: API_ENDPOINTS.JOBS.STATUS.replace(":id", id),
        data: statusData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get jobs assigned to a specific technician
   * @param {string} technicianId - Technician ID
   * @param {JobFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of assigned jobs
   * @throws {Error} When job retrieval fails
   */
  async getByTechnician(technicianId, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.JOBS.BY_TECHNICIAN.replace(
          ":technicianId",
          technicianId
        ),
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get jobs for a specific customer
   * @param {string} customerId - Customer ID
   * @param {JobFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of customer jobs
   * @throws {Error} When job retrieval fails
   */
  async getByCustomer(customerId, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/jobs/customer/${customerId}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get jobs by status
   * @param {string} status - Job status to filter by
   * @param {JobFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of jobs with specified status
   * @throws {Error} When job retrieval fails
   */
  async getByStatus(status, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.JOBS.BY_STATUS.replace(":status", status),
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get jobs within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {JobFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of jobs within date range
   * @throws {Error} When job retrieval fails
   */
  async getByDateRange(startDate, endDate, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/jobs/date-range",
        params: {
          ...params,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search jobs by text
   * @param {string} searchTerm - Search term
   * @param {JobFilters} params - Additional query parameters
   * @returns {Promise<Object>} Search results
   * @throws {Error} When search fails
   */
  async search(searchTerm, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/jobs/search",
        params: {
          ...params,
          q: searchTerm,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get job statistics
   * @param {Object} params - Query parameters for statistics
   * @returns {Promise<Object>} Job statistics
   * @throws {Error} When statistics retrieval fails
   */
  async getStatistics(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/jobs/statistics",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const jobService = new JobService();

export default jobService;
