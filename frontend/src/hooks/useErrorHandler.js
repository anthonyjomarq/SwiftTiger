/**
 * React Hook for Error Handling
 * Integrates error handling with React components and toast notifications
 */

import { useState, useCallback, useEffect } from "react";
import {
  handleGlobalError,
  parseApiError,
  getUserFriendlyMessage,
  buildErrorContext,
  ERROR_TYPES,
  ERROR_SEVERITY,
} from "../utils/errorHandler";
import { toast } from "../utils/toast";

/**
 * Custom hook for error handling in React components
 * @param {Object} options - Hook options
 * @returns {Object} Error handling utilities
 */
export const useErrorHandler = (options = {}) => {
  const {
    showToast = true,
    autoHandle = true,
    context = {},
    onError = null,
  } = options;

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle error with optional toast notification
   * @param {Error} error - Error to handle
   * @param {Object} errorContext - Additional error context
   */
  const handleError = useCallback(
    (error, errorContext = {}) => {
      const parsedError = parseApiError(error);
      const userMessage = getUserFriendlyMessage(parsedError, context.type);

      const fullContext = {
        ...context,
        ...errorContext,
        component: "useErrorHandler",
      };

      // Handle error globally
      const handledError = handleGlobalError(error, fullContext);

      // Update local state
      setError(handledError);

      // Show toast if enabled
      if (showToast) {
        const toastOptions = {
          duration:
            handledError.severity === ERROR_SEVERITY.CRITICAL ? 10000 : 5000,
          dismissible: true,
        };

        toast.error(userMessage, toastOptions);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(handledError, fullContext);
      }

      return handledError;
    },
    [showToast, context, onError]
  );

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wrap async function with error handling
   * @param {Function} asyncFunction - Async function to wrap
   * @param {Object} errorContext - Additional error context
   * @returns {Function} Wrapped function
   */
  const withErrorHandling = useCallback(
    (asyncFunction, errorContext = {}) => {
      return async (...args) => {
        setIsLoading(true);
        clearError();

        try {
          const result = await asyncFunction(...args);
          setIsLoading(false);
          return result;
        } catch (error) {
          setIsLoading(false);
          handleError(error, errorContext);
          throw error;
        }
      };
    },
    [handleError, clearError]
  );

  /**
   * Handle API errors with retry logic
   * @param {Function} apiCall - API function to call
   * @param {Object} options - Retry options
   * @returns {Promise} API result
   */
  const handleApiCall = useCallback(
    async (apiCall, options = {}) => {
      const {
        retries = 3,
        retryDelay = 1000,
        errorContext = {},
        onSuccess = null,
        onRetry = null,
      } = options;

      setIsLoading(true);
      clearError();

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await apiCall();
          setIsLoading(false);

          if (onSuccess) {
            onSuccess(result);
          }

          return result;
        } catch (error) {
          const parsedError = parseApiError(error);

          // Don't retry on certain error types
          if (
            parsedError.type === ERROR_TYPES.AUTHENTICATION ||
            parsedError.type === ERROR_TYPES.AUTHORIZATION ||
            parsedError.type === ERROR_TYPES.VALIDATION
          ) {
            setIsLoading(false);
            handleError(error, errorContext);
            throw error;
          }

          // Last attempt
          if (attempt === retries) {
            setIsLoading(false);
            handleError(error, {
              ...errorContext,
              attempts: retries,
              finalAttempt: true,
            });
            throw error;
          }

          // Retry logic
          if (onRetry) {
            onRetry(error, attempt, retries);
          }

          // Show retry toast
          if (showToast) {
            toast.warning(`Attempt ${attempt} failed. Retrying...`, {
              duration: 2000,
            });
          }

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * attempt)
          );
        }
      }
    },
    [handleError, clearError, showToast]
  );

  /**
   * Handle form submission with error handling
   * @param {Function} submitFunction - Submit function
   * @param {Object} options - Submit options
   * @returns {Function} Wrapped submit function
   */
  const handleSubmit = useCallback(
    (submitFunction, options = {}) => {
      const {
        onSuccess = null,
        successMessage = "Operation completed successfully",
        errorContext = {},
      } = options;

      return async (formData) => {
        setIsLoading(true);
        clearError();

        try {
          const result = await submitFunction(formData);
          setIsLoading(false);

          if (onSuccess) {
            onSuccess(result);
          }

          if (showToast && successMessage) {
            toast.success(successMessage);
          }

          return result;
        } catch (error) {
          setIsLoading(false);
          handleError(error, {
            ...errorContext,
            formData: formData ? Object.keys(formData) : null,
          });
          throw error;
        }
      };
    },
    [handleError, clearError, showToast]
  );

  /**
   * Handle file upload with progress and error handling
   * @param {Function} uploadFunction - Upload function
   * @param {Object} options - Upload options
   * @returns {Function} Wrapped upload function
   */
  const handleFileUpload = useCallback(
    (uploadFunction, options = {}) => {
      const {
        onProgress = null,
        onSuccess = null,
        errorContext = {},
        maxFileSize = 10 * 1024 * 1024, // 10MB
        allowedTypes = [],
      } = options;

      return async (file) => {
        // Validate file
        if (file.size > maxFileSize) {
          const error = new Error(
            `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`
          );
          handleError(error, {
            ...errorContext,
            fileSize: file.size,
            maxFileSize,
          });
          throw error;
        }

        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
          const error = new Error(`File type ${file.type} is not allowed`);
          handleError(error, {
            ...errorContext,
            fileType: file.type,
            allowedTypes,
          });
          throw error;
        }

        setIsLoading(true);
        clearError();

        try {
          const result = await uploadFunction(file, onProgress);
          setIsLoading(false);

          if (onSuccess) {
            onSuccess(result);
          }

          if (showToast) {
            toast.success("File uploaded successfully");
          }

          return result;
        } catch (error) {
          setIsLoading(false);
          handleError(error, {
            ...errorContext,
            fileName: file.name,
            fileSize: file.size,
          });
          throw error;
        }
      };
    },
    [handleError, clearError, showToast]
  );

  /**
   * Handle navigation errors
   * @param {Function} navigationFunction - Navigation function
   * @param {Object} options - Navigation options
   * @returns {Function} Wrapped navigation function
   */
  const handleNavigation = useCallback(
    (navigationFunction, options = {}) => {
      const { errorContext = {}, fallbackRoute = "/" } = options;

      return async (...args) => {
        try {
          return await navigationFunction(...args);
        } catch (error) {
          handleError(error, {
            ...errorContext,
            navigation: true,
          });

          // Navigate to fallback route on navigation error
          if (window.location.pathname !== fallbackRoute) {
            window.location.href = fallbackRoute;
          }

          throw error;
        }
      };
    },
    [handleError]
  );

  // Auto-handle unhandled promise rejections
  useEffect(() => {
    if (!autoHandle) return;

    const handleUnhandledRejection = (event) => {
      event.preventDefault();
      handleError(event.reason, {
        type: "unhandled_rejection",
        autoHandled: true,
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [autoHandle, handleError]);

  return {
    // State
    error,
    isLoading,

    // Actions
    handleError,
    clearError,
    withErrorHandling,
    handleApiCall,
    handleSubmit,
    handleFileUpload,
    handleNavigation,

    // Utilities
    hasError: !!error,
    errorType: error?.type,
    errorSeverity: error?.severity,
    userMessage: error?.userMessage,

    // Context builder
    buildErrorContext: (action, resource, additionalContext = {}) =>
      buildErrorContext(action, resource, { ...context, ...additionalContext }),
  };
};

/**
 * Hook for handling specific error types
 * @param {string} errorType - Type of error to handle
 * @param {Object} options - Hook options
 * @returns {Object} Error handling utilities
 */
export const useErrorTypeHandler = (errorType, options = {}) => {
  const errorHandler = useErrorHandler(options);

  const handleSpecificError = useCallback(
    (error, context = {}) => {
      const parsedError = parseApiError(error);

      if (parsedError.type === errorType) {
        return errorHandler.handleError(error, context);
      }

      // Re-throw if not the expected error type
      throw error;
    },
    [errorType, errorHandler]
  );

  return {
    ...errorHandler,
    handleError: handleSpecificError,
  };
};

/**
 * Hook for handling authentication errors
 * @param {Object} options - Hook options
 * @returns {Object} Authentication error handling utilities
 */
export const useAuthErrorHandler = (options = {}) => {
  return useErrorTypeHandler(ERROR_TYPES.AUTHENTICATION, {
    ...options,
    context: { type: "auth", ...options.context },
  });
};

/**
 * Hook for handling validation errors
 * @param {Object} options - Hook options
 * @returns {Object} Validation error handling utilities
 */
export const useValidationErrorHandler = (options = {}) => {
  return useErrorTypeHandler(ERROR_TYPES.VALIDATION, {
    ...options,
    context: { type: "validation", ...options.context },
  });
};

/**
 * Hook for handling network errors
 * @param {Object} options - Hook options
 * @returns {Object} Network error handling utilities
 */
export const useNetworkErrorHandler = (options = {}) => {
  return useErrorTypeHandler(ERROR_TYPES.NETWORK, {
    ...options,
    context: { type: "network", ...options.context },
  });
};

export default useErrorHandler;
