// server/middleware/errorHandler.js
import { logger } from "../utils/logger.js";

// Async handler wrapper to catch async errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Main error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const message = err.errors.map((val) => val.message).join(", ");
    error = {
      statusCode: 400,
      message: `Validation Error: ${message}`,
    };
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors[0].path;
    error = {
      statusCode: 400,
      message: `${field} already exists`,
    };
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    error = {
      statusCode: 400,
      message: "Invalid reference to related data",
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = {
      statusCode: 401,
      message: "Invalid token",
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      statusCode: 401,
      message: "Token expired",
    };
  }

  // Cast error (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    error = {
      statusCode: 400,
      message: "Invalid ID format",
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

// Handle 404 errors
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
