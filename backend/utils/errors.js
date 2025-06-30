/**
 * Custom Error Classes for SwiftTiger Backend
 * Provides specific error types for better error handling and client responses
 */

class ValidationError extends Error {
  constructor(message = "Validation failed", field = null) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(message = "Resource not found", resource = null) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
    this.resource = resource;
  }
}

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

class ConflictError extends Error {
  constructor(message = "Resource conflict", field = null) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.field = field;
  }
}

/**
 * Error handler utility to convert custom errors to API responses
 */
const handleError = (error) => {
  console.error(`${error.name}:`, error.message);

  // Handle custom errors
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      field: error.field,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      resource: error.resource,
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof ConflictError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      field: error.field,
    };
  }

  // Handle database errors
  if (error.code === "23505") {
    // Unique constraint violation
    return {
      success: false,
      error: "Resource already exists",
      statusCode: 409,
    };
  }

  if (error.code === "23503") {
    // Foreign key constraint violation
    return {
      success: false,
      error: "Referenced resource does not exist",
      statusCode: 400,
    };
  }

  // Default error
  return {
    success: false,
    error: "Internal server error",
    statusCode: 500,
  };
};

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  handleError,
};
