import axios from "axios";

/**
 * @typedef {Object} ApiConfig
 * @property {string} baseURL - The base URL for API requests
 * @property {number} timeout - Request timeout in milliseconds
 * @property {Object} headers - Default headers to include in requests
 */

/**
 * @typedef {Object} RequestConfig
 * @property {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @property {string} url - Request URL
 * @property {*} [data] - Request body data
 * @property {Object} [params] - URL query parameters
 * @property {Object} [headers] - Additional headers
 * @property {AbortSignal} [signal] - AbortController signal for cancellation
 */

/**
 * @typedef {Object} RetryConfig
 * @property {number} retries - Maximum number of retry attempts
 * @property {Function} retryDelay - Function to calculate delay between retries
 * @property {Function} retryCondition - Function to determine if retry should occur
 */

/**
 * @typedef {Object} ApiError
 * @property {string} type - Error type (validation, auth, permission, network, server, unknown)
 * @property {string} message - Error message
 * @property {*} [details] - Additional error details
 */

/**
 * Base API class providing common functionality for all API services
 * @class BaseApi
 */
class BaseApi {
  /**
   * Create a new BaseApi instance
   * @param {ApiConfig} config - Configuration for the API instance
   */
  constructor(config = {}) {
    const {
      baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api",
      timeout = 30000,
      headers = {
        "Content-Type": "application/json",
      },
    } = config;

    this.baseURL = baseURL;
    this.pendingRequests = new Map();

    // Create axios instance
    this.api = axios.create({
      baseURL,
      timeout,
      headers,
    });

    // Configure interceptors
    this.setupInterceptors();

    // Configure retry logic
    this.retryConfig = {
      retries: 3,
      retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // Exponential backoff
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return (
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600)
        );
      },
    };
  }

  /**
   * Set up request and response interceptors
   * @private
   */
  setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for tracking
        config.metadata = { startTime: new Date() };

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(
            `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
            config.data
          );
        }

        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = new Date() - response.config.metadata.startTime;

        // Log response in development
        if (import.meta.env.DEV) {
          console.log(
            `✅ API Response: ${response.config.method?.toUpperCase()} ${
              response.config.url
            } (${duration}ms)`,
            response.data
          );
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const duration = originalRequest?.metadata
          ? new Date() - originalRequest.metadata.startTime
          : 0;

        // Log error in development
        if (import.meta.env.DEV) {
          console.error(
            `❌ API Error: ${originalRequest?.method?.toUpperCase()} ${
              originalRequest?.url
            } (${duration}ms)`,
            error.response?.data || error.message
          );
        }

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const refreshResponse = await axios.post(
                `${this.baseURL}/auth/refresh`,
                {
                  refreshToken,
                }
              );

              const { token } = refreshResponse.data;
              localStorage.setItem("token", token);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate a unique key for request deduplication
   * @param {RequestConfig} config - Request configuration
   * @returns {string} Unique request key
   * @private
   */
  generateRequestKey(config) {
    return `${config.method}-${config.url}-${JSON.stringify(
      config.data || {}
    )}`;
  }

  /**
   * Make API request with retry logic, deduplication, and cancellation support
   * @param {RequestConfig} config - Request configuration
   * @returns {Promise<Object>} API response
   */
  async request(config) {
    const requestKey = this.generateRequestKey(config);

    // Check if same request is already pending
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    // Create AbortController for cancellation
    const controller = new AbortController();
    config.signal = controller.signal;

    // Make request with retry logic
    const requestPromise = this.requestWithRetry(config, controller);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      this.pendingRequests.delete(requestKey);
      return response;
    } catch (error) {
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }

  /**
   * Make API request with retry logic
   * @param {RequestConfig} config - Request configuration
   * @param {AbortController} controller - AbortController for cancellation
   * @param {number} retryCount - Current retry attempt number
   * @returns {Promise<Object>} API response
   * @private
   */
  async requestWithRetry(config, controller, retryCount = 0) {
    try {
      return await this.api(config);
    } catch (error) {
      // Don't retry if request was cancelled
      if (error.name === "AbortError") {
        throw error;
      }

      if (
        retryCount < this.retryConfig.retries &&
        this.retryConfig.retryCondition(error)
      ) {
        const delay = this.retryConfig.retryDelay(retryCount);

        if (import.meta.env.DEV) {
          console.log(
            `🔄 Retrying request (${retryCount + 1}/${
              this.retryConfig.retries
            }) in ${delay}ms`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry(config, controller, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Cancel a specific pending request
   * @param {RequestConfig} config - Request configuration to cancel
   */
  cancelRequest(config) {
    const requestKey = this.generateRequestKey(config);
    const pendingRequest = this.pendingRequests.get(requestKey);

    if (pendingRequest) {
      // Cancel the request
      pendingRequest.cancel?.();
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.pendingRequests.forEach((request) => {
      request.cancel?.();
    });
    this.pendingRequests.clear();
  }

  /**
   * Handle API errors and return standardized error format
   * @param {Error} error - The error to handle
   * @returns {ApiError} Standardized error object
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return {
            type: "validation",
            message: data.error || "Invalid request data",
            details: data.errors,
          };
        case 401:
          return {
            type: "auth",
            message: "Authentication required",
          };
        case 403:
          return {
            type: "permission",
            message: "You do not have permission to perform this action",
          };
        case 404:
          return {
            type: "not_found",
            message: "Resource not found",
          };
        case 422:
          return {
            type: "validation",
            message: data.error || "Validation failed",
            details: data.errors,
          };
        case 500:
          return {
            type: "server",
            message: "Internal server error. Please try again later.",
          };
        default:
          return {
            type: "unknown",
            message: data.error || "An unexpected error occurred",
          };
      }
    } else if (error.request) {
      // Network error
      return {
        type: "network",
        message: "Network error. Please check your connection.",
      };
    } else {
      // Other error
      return {
        type: "unknown",
        message: error.message || "An unexpected error occurred",
      };
    }
  }
}

export default BaseApi;
