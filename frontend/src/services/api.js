import { useState } from "react";
import authService from "./authService.js";
import jobService from "./jobService.js";
import customerService from "./customerService.js";
import routeService from "./routeService.js";
import notificationService from "./notificationService.js";
import activityService from "./activityService.js";

/**
 * @typedef {Object} ApiCallOptions
 * @property {boolean} [showLoading=true] - Whether to show loading state
 * @property {boolean} [handleError=true] - Whether to handle errors automatically
 */

/**
 * Main API service that provides access to all individual services
 * @class ApiService
 */
class ApiService {
  constructor() {
    // Expose individual services
    this.auth = authService;
    this.jobs = jobService;
    this.customers = customerService;
    this.routes = routeService;
    this.notifications = notificationService;
    this.activities = activityService;
  }

  /**
   * Cancel all pending requests across all services
   */
  cancelAllRequests() {
    this.auth.cancelAllRequests();
    this.jobs.cancelAllRequests();
    this.customers.cancelAllRequests();
    this.routes.cancelAllRequests();
    this.notifications.cancelAllRequests();
    this.activities.cancelAllRequests();
  }

  /**
   * Handle API errors and return standardized error format
   * @param {Error} error - The error to handle
   * @returns {Object} Standardized error object
   */
  handleApiError(error) {
    // Use the base API error handling
    return this.auth.handleError(error);
  }
}

// Create singleton instance
const apiService = new ApiService();

/**
 * Handle API errors and return standardized error format
 * @param {Error} error - The error to handle
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error) => {
  return apiService.handleApiError(error);
};

/**
 * React hook for API calls with loading state
 * @returns {Object} Hook with loading state, error handling, and API call function
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Make an API call with loading and error handling
   * @param {Function} apiCall - The API function to call
   * @param {ApiCallOptions} options - Options for the API call
   * @returns {Promise<*>} API response data
   */
  const callApi = async (apiCall, options = {}) => {
    const { showLoading = true, handleError = true } = options;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      return response.data;
    } catch (err) {
      const errorInfo = handleApiError(err);
      if (handleError) {
        setError(errorInfo);
      }
      throw errorInfo;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  return {
    loading,
    error,
    callApi,
    clearError: () => setError(null),
  };
};

// Export individual services for direct access
export {
  authService,
  jobService,
  customerService,
  routeService,
  notificationService,
  activityService,
};

// Export the main API service as default
export default apiService;
