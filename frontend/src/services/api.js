import axios from "axios";
import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
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
api.interceptors.response.use(
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
            `${API_BASE_URL}/auth/refresh`,
            {
              refreshToken,
            }
          );

          const { token } = refreshResponse.data;
          localStorage.setItem("token", token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
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

// Retry configuration
const retryConfig = {
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

// Enhanced request function with retry logic
const requestWithRetry = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    if (retryCount < retryConfig.retries && retryConfig.retryCondition(error)) {
      const delay = retryConfig.retryDelay(retryCount);

      if (import.meta.env.DEV) {
        console.log(
          `🔄 Retrying request (${retryCount + 1}/${
            retryConfig.retries
          }) in ${delay}ms`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return requestWithRetry(config, retryCount + 1);
    }
    throw error;
  }
};

// API service class
class ApiService {
  constructor() {
    this.pendingRequests = new Map();
  }

  // Generate request key for deduplication
  generateRequestKey(config) {
    return `${config.method}-${config.url}-${JSON.stringify(
      config.data || {}
    )}`;
  }

  // Make API request with deduplication and cancellation
  async request(config) {
    const requestKey = this.generateRequestKey(config);

    // Check if same request is already pending
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    // Create AbortController for cancellation
    const controller = new AbortController();
    config.signal = controller.signal;

    // Make request
    const requestPromise = requestWithRetry(config);
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

  // Cancel pending request
  cancelRequest(config) {
    const requestKey = this.generateRequestKey(config);
    const pendingRequest = this.pendingRequests.get(requestKey);

    if (pendingRequest) {
      // Cancel the request
      pendingRequest.cancel?.();
      this.pendingRequests.delete(requestKey);
    }
  }

  // Cancel all pending requests
  cancelAllRequests() {
    this.pendingRequests.forEach((request) => {
      request.cancel?.();
    });
    this.pendingRequests.clear();
  }

  // Auth endpoints
  auth = {
    login: (credentials) =>
      this.request({
        method: "POST",
        url: "/auth/login",
        data: credentials,
      }),

    register: (userData) =>
      this.request({
        method: "POST",
        url: "/auth/register",
        data: userData,
      }),

    refresh: (refreshToken) =>
      this.request({
        method: "POST",
        url: "/auth/refresh",
        data: { refreshToken },
      }),

    me: () =>
      this.request({
        method: "GET",
        url: "/auth/me",
      }),

    logout: () =>
      this.request({
        method: "POST",
        url: "/auth/logout",
      }),
  };

  // Jobs endpoints
  jobs = {
    getAll: (params = {}) =>
      this.request({
        method: "GET",
        url: "/jobs",
        params,
      }),

    getById: (id) =>
      this.request({
        method: "GET",
        url: `/jobs/${id}`,
      }),

    create: (jobData) =>
      this.request({
        method: "POST",
        url: "/jobs",
        data: jobData,
      }),

    update: (id, jobData) =>
      this.request({
        method: "PUT",
        url: `/jobs/${id}`,
        data: jobData,
      }),

    delete: (id) =>
      this.request({
        method: "DELETE",
        url: `/jobs/${id}`,
      }),

    updateStatus: (id, status, notes) =>
      this.request({
        method: "PATCH",
        url: `/jobs/${id}/status`,
        data: { status, notes },
      }),
  };

  // Customers endpoints
  customers = {
    getAll: (params = {}) =>
      this.request({
        method: "GET",
        url: "/customers",
        params,
      }),

    getById: (id) =>
      this.request({
        method: "GET",
        url: `/customers/${id}`,
      }),

    create: (customerData) =>
      this.request({
        method: "POST",
        url: "/customers",
        data: customerData,
      }),

    update: (id, customerData) =>
      this.request({
        method: "PUT",
        url: `/customers/${id}`,
        data: customerData,
      }),

    delete: (id) =>
      this.request({
        method: "DELETE",
        url: `/customers/${id}`,
      }),
  };

  // Route planning endpoints
  routes = {
    optimize: (jobs, startLocation, options = {}) =>
      this.request({
        method: "POST",
        url: "/routes/optimize",
        data: { jobs, startLocation, options },
      }),

    calculateETA: (route, startLocation) =>
      this.request({
        method: "POST",
        url: "/routes/eta",
        data: { route, startLocation },
      }),
  };

  // Notifications endpoints
  notifications = {
    getAll: (params = {}) =>
      this.request({
        method: "GET",
        url: "/notifications",
        params,
      }),

    markRead: (id) =>
      this.request({
        method: "PATCH",
        url: `/notifications/${id}/read`,
      }),

    markAllRead: () =>
      this.request({
        method: "PATCH",
        url: "/notifications/read-all",
      }),
  };

  // Activity log endpoints
  activities = {
    getAll: (params = {}) =>
      this.request({
        method: "GET",
        url: "/activities",
        params,
      }),

    getByUser: (userId, params = {}) =>
      this.request({
        method: "GET",
        url: `/activities/user/${userId}`,
        params,
      }),
  };
}

// Create singleton instance
const apiService = new ApiService();

// Error handling utilities
export const handleApiError = (error) => {
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
};

// React hook for API calls with loading state
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

export default apiService;
