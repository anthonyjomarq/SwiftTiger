/**
 * Standard API Response Helpers
 * Provides consistent response formatting across all API endpoints
 */

/**
 * Send a successful response
 * @param {Object} data - The data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
const successResponse = (data, message = "Success", statusCode = 200) => {
  return {
    success: true,
    data: data || {},
    message: message,
    errors: [],
    statusCode: statusCode,
  };
};

/**
 * Send an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object|null} details - Additional error details
 * @returns {Object} Formatted error response
 */
const errorResponse = (message, statusCode = 400, details = null) => {
  return {
    success: false,
    data: {},
    message: message,
    errors: details ? [details] : [],
    statusCode: statusCode,
  };
};

/**
 * Send a validation error response
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Formatted validation error response
 */
const validationErrorResponse = (errors) => {
  return {
    success: false,
    data: {},
    message: "Validation failed",
    errors: errors,
    statusCode: 400,
  };
};

/**
 * Send a not found response
 * @param {string} resource - Name of the resource that was not found
 * @returns {Object} Formatted not found response
 */
const notFoundResponse = (resource = "Resource") => {
  return {
    success: false,
    data: {},
    message: `${resource} not found`,
    errors: [],
    statusCode: 404,
  };
};

/**
 * Send an unauthorized response
 * @returns {Object} Formatted unauthorized response
 */
const unauthorizedResponse = () => {
  return {
    success: false,
    data: {},
    message: "Unauthorized access",
    errors: [],
    statusCode: 401,
  };
};

/**
 * Send a forbidden response
 * @returns {Object} Formatted forbidden response
 */
const forbiddenResponse = () => {
  return {
    success: false,
    data: {},
    message: "Access forbidden",
    errors: [],
    statusCode: 403,
  };
};

/**
 * Send an internal server error response
 * @param {string} message - Error message (default: "Internal server error")
 * @returns {Object} Formatted internal server error response
 */
const internalServerErrorResponse = (message = "Internal server error") => {
  return {
    success: false,
    data: {},
    message: message,
    errors: [],
    statusCode: 500,
  };
};

/**
 * Helper function to send response to client
 * @param {Object} res - Express response object
 * @param {Object} result - Result object from service layer
 */
const sendResponse = (res, result) => {
  const statusCode = result.statusCode || 200;

  if (result.success) {
    res.status(statusCode).json({
      success: true,
      data: result.data || {},
      message: result.message || "Success",
      errors: [],
    });
  } else {
    res.status(statusCode).json({
      success: false,
      data: {},
      message: result.error || result.message || "Error occurred",
      errors: result.errors || [],
    });
  }
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  sendResponse,
};
