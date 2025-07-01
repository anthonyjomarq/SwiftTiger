/**
 * Error Handling Utilities for SwiftTiger Frontend
 * Provides centralized error handling, parsing, and reporting
 */

import { UI_TEXT, API_ENDPOINTS } from "../config/constants";

// Error Types
export const ERROR_TYPES = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  NOT_FOUND: "not_found",
  SERVER: "server",
  CLIENT: "client",
  UNKNOWN: "unknown",
};

// Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

/**
 * Parse API errors and return standardized error object
 * @param {Error|Object} error - The error to parse
 * @returns {Object} Standardized error object
 */
export const parseApiError = (error) => {
  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return {
          type: ERROR_TYPES.VALIDATION,
          severity: ERROR_SEVERITY.MEDIUM,
          message: data.error || UI_TEXT.MESSAGES.ERROR.VALIDATION_ERROR,
          details: data.errors || data.details,
          statusCode: status,
          originalError: error,
        };

      case 401:
        return {
          type: ERROR_TYPES.AUTHENTICATION,
          severity: ERROR_SEVERITY.HIGH,
          message: UI_TEXT.MESSAGES.ERROR.AUTH_ERROR,
          statusCode: status,
          originalError: error,
        };

      case 403:
        return {
          type: ERROR_TYPES.AUTHORIZATION,
          severity: ERROR_SEVERITY.HIGH,
          message: UI_TEXT.MESSAGES.ERROR.PERMISSION_ERROR,
          statusCode: status,
          originalError: error,
        };

      case 404:
        return {
          type: ERROR_TYPES.NOT_FOUND,
          severity: ERROR_SEVERITY.MEDIUM,
          message: UI_TEXT.MESSAGES.ERROR.NOT_FOUND,
          statusCode: status,
          originalError: error,
        };

      case 422:
        return {
          type: ERROR_TYPES.VALIDATION,
          severity: ERROR_SEVERITY.MEDIUM,
          message: data.error || UI_TEXT.MESSAGES.ERROR.VALIDATION_ERROR,
          details: data.errors || data.details,
          statusCode: status,
          originalError: error,
        };

      case 429:
        return {
          type: ERROR_TYPES.CLIENT,
          severity: ERROR_SEVERITY.MEDIUM,
          message: "Too many requests. Please try again later.",
          statusCode: status,
          originalError: error,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ERROR_TYPES.SERVER,
          severity: ERROR_SEVERITY.HIGH,
          message: UI_TEXT.MESSAGES.ERROR.SERVER_ERROR,
          statusCode: status,
          originalError: error,
        };

      default:
        return {
          type: ERROR_TYPES.UNKNOWN,
          severity: ERROR_SEVERITY.MEDIUM,
          message: data.error || UI_TEXT.MESSAGES.ERROR.UNKNOWN_ERROR,
          statusCode: status,
          originalError: error,
        };
    }
  }

  // Handle network errors
  if (error.request) {
    return {
      type: ERROR_TYPES.NETWORK,
      severity: ERROR_SEVERITY.HIGH,
      message: UI_TEXT.MESSAGES.ERROR.NETWORK_ERROR,
      originalError: error,
    };
  }

  // Handle other errors
  return {
    type: ERROR_TYPES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    message: error.message || UI_TEXT.MESSAGES.ERROR.UNKNOWN_ERROR,
    originalError: error,
  };
};

/**
 * Get user-friendly error message
 * @param {Object} parsedError - Parsed error object
 * @param {string} context - Error context (e.g., 'job', 'customer', 'auth')
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (parsedError, context = "") => {
  const { type, message, details } = parsedError;

  // If we have a specific message, use it
  if (message && message !== UI_TEXT.MESSAGES.ERROR.UNKNOWN_ERROR) {
    return message;
  }

  // Generate context-specific messages
  const contextMessages = {
    job: {
      [ERROR_TYPES.VALIDATION]: "Please check the job details and try again.",
      [ERROR_TYPES.NOT_FOUND]: "The requested job was not found.",
      [ERROR_TYPES.AUTHORIZATION]:
        "You do not have permission to access this job.",
    },
    customer: {
      [ERROR_TYPES.VALIDATION]:
        "Please check the customer information and try again.",
      [ERROR_TYPES.NOT_FOUND]: "The requested customer was not found.",
      [ERROR_TYPES.AUTHORIZATION]:
        "You do not have permission to access this customer.",
    },
    auth: {
      [ERROR_TYPES.AUTHENTICATION]: "Please log in again to continue.",
      [ERROR_TYPES.AUTHORIZATION]:
        "You do not have permission to perform this action.",
    },
  };

  const contextSpecificMessage = contextMessages[context]?.[type];
  if (contextSpecificMessage) {
    return contextSpecificMessage;
  }

  // Fallback to generic messages
  const genericMessages = {
    [ERROR_TYPES.NETWORK]: UI_TEXT.MESSAGES.ERROR.NETWORK_ERROR,
    [ERROR_TYPES.VALIDATION]: UI_TEXT.MESSAGES.ERROR.VALIDATION_ERROR,
    [ERROR_TYPES.AUTHENTICATION]: UI_TEXT.MESSAGES.ERROR.AUTH_ERROR,
    [ERROR_TYPES.AUTHORIZATION]: UI_TEXT.MESSAGES.ERROR.PERMISSION_ERROR,
    [ERROR_TYPES.NOT_FOUND]: UI_TEXT.MESSAGES.ERROR.NOT_FOUND,
    [ERROR_TYPES.SERVER]: UI_TEXT.MESSAGES.ERROR.SERVER_ERROR,
    [ERROR_TYPES.UNKNOWN]: UI_TEXT.MESSAGES.ERROR.UNKNOWN_ERROR,
  };

  return genericMessages[type] || UI_TEXT.MESSAGES.ERROR.UNKNOWN_ERROR;
};

/**
 * Error reporting service
 */
class ErrorReportingService {
  constructor() {
    this.enabled = process.env.NODE_ENV === "production";
    this.endpoint = process.env.VITE_ERROR_REPORTING_ENDPOINT || "/api/errors";
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Report error to external service
   * @param {Object} error - Error object to report
   * @param {Object} context - Additional context
   */
  async reportError(error, context = {}) {
    if (!this.enabled) {
      console.error("Error (development mode):", error);
      return;
    }

    const errorData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: {
        message: error.message,
        stack: error.stack,
        type: error.type,
        severity: error.severity,
      },
      context: {
        ...context,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
      },
    };

    try {
      await this.sendErrorReport(errorData);
    } catch (reportError) {
      console.error("Failed to report error:", reportError);
    }
  }

  /**
   * Send error report to server
   * @param {Object} errorData - Error data to send
   */
  async sendErrorReport(errorData, retryCount = 0) {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(errorData),
      });

      if (!response.ok && retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.sendErrorReport(errorData, retryCount + 1);
      }
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.sendErrorReport(errorData, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Get current user ID from storage
   */
  getCurrentUserId() {
    try {
      const userData = localStorage.getItem("user_data");
      return userData ? JSON.parse(userData).id : null;
    } catch {
      return null;
    }
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return sessionStorage.getItem("session_id") || "unknown";
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    return localStorage.getItem("auth_token") || "";
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const errorReportingService = new ErrorReportingService();

/**
 * Global error handler
 * @param {Error} error - The error to handle
 * @param {Object} context - Error context
 */
export const handleGlobalError = (error, context = {}) => {
  const parsedError = parseApiError(error);
  const userMessage = getUserFriendlyMessage(parsedError, context.type);

  // Report error
  errorReportingService.reportError(parsedError, context);

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Global Error:", {
      error: parsedError,
      context,
      userMessage,
    });
  }

  return {
    ...parsedError,
    userMessage,
  };
};

/**
 * React Error Boundary Component
 */
import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Report error
    errorReportingService.reportError(
      {
        message: error.message,
        stack: error.stack,
        type: "react_boundary",
        severity: ERROR_SEVERITY.HIGH,
      },
      {
        componentStack: errorInfo.componentStack,
        type: "react_boundary",
      }
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                We're sorry, but something unexpected happened. Please try
                refreshing the page.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
              </div>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async errors
 * @param {Function} asyncFunction - Async function to wrap
 * @param {Object} context - Error context
 * @returns {Function} Wrapped function with error handling
 */
export const useAsyncErrorHandler = (asyncFunction, context = {}) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      const handledError = handleGlobalError(error, context);
      throw handledError;
    }
  };
};

/**
 * Toast notification for errors
 * @param {Object} error - Parsed error object
 * @param {Function} showToast - Toast function from your toast library
 */
export const showErrorToast = (error, showToast) => {
  if (!showToast) return;

  const message = error.userMessage || error.message;
  const severity = error.severity;

  const toastConfig = {
    [ERROR_SEVERITY.LOW]: { type: "info", duration: 3000 },
    [ERROR_SEVERITY.MEDIUM]: { type: "warning", duration: 5000 },
    [ERROR_SEVERITY.HIGH]: { type: "error", duration: 7000 },
    [ERROR_SEVERITY.CRITICAL]: { type: "error", duration: 10000 },
  };

  const config = toastConfig[severity] || toastConfig[ERROR_SEVERITY.MEDIUM];

  showToast(message, config);
};

/**
 * Retry utility for failed operations
 * @param {Function} operation - Operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Result of the operation
 */
export const retryOperation = async (
  operation,
  maxRetries = 3,
  delay = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on certain error types
      const parsedError = parseApiError(error);
      if (
        parsedError.type === ERROR_TYPES.AUTHENTICATION ||
        parsedError.type === ERROR_TYPES.AUTHORIZATION ||
        parsedError.type === ERROR_TYPES.VALIDATION
      ) {
        break;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

/**
 * Error context builder
 * @param {string} action - Action being performed
 * @param {string} resource - Resource being acted upon
 * @param {Object} additionalContext - Additional context
 * @returns {Object} Error context object
 */
export const buildErrorContext = (
  action,
  resource,
  additionalContext = {}
) => ({
  action,
  resource,
  timestamp: new Date().toISOString(),
  url: window.location.href,
  ...additionalContext,
});

export default {
  parseApiError,
  getUserFriendlyMessage,
  handleGlobalError,
  ErrorBoundary,
  useAsyncErrorHandler,
  showErrorToast,
  retryOperation,
  buildErrorContext,
  errorReportingService,
  ERROR_TYPES,
  ERROR_SEVERITY,
};
