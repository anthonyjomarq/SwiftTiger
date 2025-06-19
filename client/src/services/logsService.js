import api from "./api";

export const logsService = {
  /**
   * Get activity logs with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with logs and pagination info
   */
  async getLogs(params = {}) {
    const response = await api.get("/logs", { params });
    return response.data.data;
  },

  /**
   * Get logs for a specific user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with logs
   */
  async getUserLogs(userId, params = {}) {
    const response = await api.get(`/logs/user/${userId}`, { params });
    return response.data.data;
  },

  /**
   * Get logs for a specific resource
   * @param {string} resourceType - Resource type (USER, JOB, etc.)
   * @param {string} resourceId - Resource ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with logs
   */
  async getResourceLogs(resourceType, resourceId, params = {}) {
    const response = await api.get(`/logs/${resourceType}/${resourceId}`, {
      params,
    });
    return response.data.data;
  },

  /**
   * Get log statistics
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with statistics
   */
  async getLogStats(params = {}) {
    const response = await api.get("/logs/stats", { params });
    return response.data.data;
  },

  /**
   * Export logs as CSV
   * @param {Object} params - Query parameters
   * @returns {Promise} CSV data
   */
  async exportLogs(params = {}) {
    const response = await api.get("/logs/export", {
      params,
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },
};
