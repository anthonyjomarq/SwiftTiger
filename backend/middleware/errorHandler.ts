import { Request, Response, NextFunction } from "express";
import { ValidationError } from "sequelize";

// Custom error class
class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response interfaces
interface ErrorResponse {
  status: string;
  message: string;
  error?: any;
  stack?: string;
  request?: {
    method: string;
    url: string;
    body: any;
    params: any;
    query: any;
  };
}

// Development error response
const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  // Assuming you have a logger utility
  const logger = require("../utils/logger");
  logger.logError(err, req);

  const errorResponse: ErrorResponse = {
    status: err.status || "error",
    error: err,
    message: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  };

  res.status(err.statusCode || 500).json(errorResponse);
};

// Production error response
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  const logger = require("../utils/logger");

  if (err.isOperational) {
    logger.logError(err, req, { severity: "operational" });

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    logger.logError(err, req, { severity: "critical" });

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

// Error handler functions
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg
    ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0]
    : "duplicate value";
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

const handleSequelizeValidationError = (err: ValidationError): AppError => {
  const errors = err.errors.map((e) => `${e.path}: ${e.message}`);
  const message = `Validation error. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err: any): AppError => {
  const field = err.errors[0]?.path || "field";
  const message = `${field} already exists. Please use a different value.`;
  return new AppError(message, 400);
};

const handleSequelizeForeignKeyConstraintError = (): AppError => {
  const message = "Referenced record does not exist.";
  return new AppError(message, 400);
};

// Main error handling middleware
const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err, message: err.message };

    // Handle specific Sequelize errors
    if (error.name === "SequelizeValidationError") {
      error = handleSequelizeValidationError(error);
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      error = handleSequelizeUniqueConstraintError(error);
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      error = handleSequelizeForeignKeyConstraintError();
    }
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError();
    }
    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  const logger = require("../utils/logger");
  logger.error("Unhandled Promise Rejection:", {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  const logger = require("../utils/logger");
  logger.error("Uncaught Exception:", {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  process.exit(1);
});

export { AppError, asyncHandler, globalErrorHandler };
