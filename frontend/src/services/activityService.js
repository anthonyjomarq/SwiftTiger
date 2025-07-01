import BaseApi from "./baseApi.js";

/**
 * @typedef {Object} ActivityFilters
 * @property {string} [type] - Filter by activity type
 * @property {string} [userId] - Filter by user ID
 * @property {string} [entityType] - Filter by entity type (job, customer, user, etc.)
 * @property {string} [entityId] - Filter by entity ID
 * @property {Date} [startDate] - Filter activities from this date
 * @property {Date} [endDate] - Filter activities until this date
 * @property {string} [action] - Filter by action (create, update, delete, etc.)
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {string} [sortOrder] - Sort order (asc, desc)
 */

/**
 * Activity service for handling activity log API operations
 * @class ActivityService
 * @extends BaseApi
 */
class ActivityService extends BaseApi {
  /**
   * Create a new ActivityService instance
   * @param {Object} config - Configuration for the API instance
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Get all activities with optional filtering and pagination
   * @param {ActivityFilters} params - Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated list of activities
   * @throws {Error} When activity retrieval fails
   */
  async getAll(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/activities",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific activity by ID
   * @param {string} id - Activity ID
   * @returns {Promise<Object>} Activity details
   * @throws {Error} When activity retrieval fails
   */
  async getById(id) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/activities/${id}`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activities for a specific user
   * @param {string} userId - User ID
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of user activities
   * @throws {Error} When activity retrieval fails
   */
  async getByUser(userId, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/activities/user/${userId}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activities for a specific entity
   * @param {string} entityType - Entity type (job, customer, user, etc.)
   * @param {string} entityId - Entity ID
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of entity activities
   * @throws {Error} When activity retrieval fails
   */
  async getByEntity(entityType, entityId, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/activities/entity/${entityType}/${entityId}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activities by type
   * @param {string} type - Activity type
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of activities by type
   * @throws {Error} When activity retrieval fails
   */
  async getByType(type, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/activities/type/${type}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activities by action
   * @param {string} action - Activity action (create, update, delete, etc.)
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of activities by action
   * @throws {Error} When activity retrieval fails
   */
  async getByAction(action, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/activities/action/${action}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activities within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of activities within date range
   * @throws {Error} When activity retrieval fails
   */
  async getByDateRange(startDate, endDate, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/activities/date-range",
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
   * Get recent activities
   * @param {number} limit - Number of recent activities to retrieve
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of recent activities
   * @throws {Error} When activity retrieval fails
   */
  async getRecent(limit = 10, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/activities/recent",
        params: {
          ...params,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activity statistics
   * @param {Object} params - Query parameters for statistics
   * @returns {Promise<Object>} Activity statistics
   * @throws {Error} When statistics retrieval fails
   */
  async getStatistics(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/activities/statistics",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Export activities to CSV
   * @param {ActivityFilters} params - Query parameters for filtering
   * @returns {Promise<Object>} CSV export data
   * @throws {Error} When export fails
   */
  async exportToCSV(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/activities/export/csv",
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get activity timeline for a specific entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Activity timeline
   * @throws {Error} When timeline retrieval fails
   */
  async getTimeline(entityType, entityId, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/activities/timeline/${entityType}/${entityId}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search activities by text
   * @param {string} searchTerm - Search term
   * @param {ActivityFilters} params - Additional query parameters
   * @returns {Promise<Object>} Search results
   * @throws {Error} When search fails
   */
  async search(searchTerm, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/activities/search",
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
}

// Create singleton instance
const activityService = new ActivityService();

export default activityService;
