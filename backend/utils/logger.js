const winston = require("winston");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for correlation ID
const correlationIdFormat = winston.format((info) => {
  if (info.correlationId) {
    info.message = `[${info.correlationId}] ${info.message}`;
  }
  return info;
});

// Custom format for performance metrics
const performanceFormat = winston.format((info) => {
  if (info.duration) {
    info.message = `${info.message} (${info.duration}ms)`;
  }
  return info;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    correlationIdFormat(),
    performanceFormat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: "swift-tiger-backend",
    version: "1.0.0",
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(
          ({
            timestamp,
            level,
            message,
            stack,
            correlationId,
            duration,
            ...meta
          }) => {
            let log = `${timestamp} [${level}]: ${message}`;
            if (correlationId) log = `[${correlationId}] ${log}`;
            if (duration) log += ` (${duration}ms)`;
            if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
            if (stack) log += `\n${stack}`;
            return log;
          }
        )
      ),
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Separate file for error logs
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Separate file for performance logs
    new winston.transports.File({
      filename: path.join(logsDir, "performance.log"),
      level: "info",
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
    }),
  ],
});

// Correlation ID management
const correlationIds = new Map();

// Generate correlation ID for a request
const generateCorrelationId = () => uuidv4();

// Set correlation ID for current request
const setCorrelationId = (id) => {
  correlationIds.set(process.pid, id);
};

// Get correlation ID for current request
const getCorrelationId = () => {
  return correlationIds.get(process.pid);
};

// Clear correlation ID for current request
const clearCorrelationId = () => {
  correlationIds.delete(process.pid);
};

// Performance tracking
const performanceTracker = new Map();

// Start performance tracking
const startTimer = (operation) => {
  const id = uuidv4();
  performanceTracker.set(id, {
    operation,
    startTime: Date.now(),
  });
  return id;
};

// End performance tracking and log
const endTimer = (id, additionalData = {}) => {
  const timer = performanceTracker.get(id);
  if (!timer) {
    logger.warn("Performance timer not found", { timerId: id });
    return;
  }

  const duration = Date.now() - timer.startTime;
  performanceTracker.delete(id);

  logger.info(`Performance: ${timer.operation} completed`, {
    correlationId: getCorrelationId(),
    duration,
    operation: timer.operation,
    ...additionalData,
  });

  return duration;
};

// Request/Response logging middleware
const requestLogger = (req, res, next) => {
  const correlationId = generateCorrelationId();
  setCorrelationId(correlationId);

  // Add correlation ID to response headers
  res.setHeader("X-Correlation-ID", correlationId);

  const startTime = Date.now();

  // Log request
  logger.info("HTTP Request", {
    correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
    body: req.method !== "GET" ? req.body : undefined,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;

    logger.info("HTTP Response", {
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get("Content-Length") || chunk?.length || 0,
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  const correlationId = getCorrelationId();

  logger.error("Unhandled Error", {
    correlationId,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || "anonymous",
    },
  });

  next(error);
};

// Socket logging middleware
const socketLogger = (socket, next) => {
  const correlationId = generateCorrelationId();
  setCorrelationId(correlationId);

  logger.info("Socket Connection", {
    correlationId,
    socketId: socket.id,
    userId: socket.userId || "anonymous",
    userAgent: socket.handshake.headers["user-agent"],
    ip: socket.handshake.address,
  });

  // Override socket disconnect to log
  const originalDisconnect = socket.disconnect;
  socket.disconnect = function (reason) {
    logger.info("Socket Disconnection", {
      correlationId,
      socketId: socket.id,
      userId: socket.userId || "anonymous",
      reason: reason || "client_disconnect",
    });

    originalDisconnect.call(this, reason);
  };

  next();
};

// Database query logger
const dbLogger = {
  query: (query, params, duration) => {
    logger.debug("Database Query", {
      correlationId: getCorrelationId(),
      query: query.trim(),
      params,
      duration,
    });
  },

  error: (error, query, params) => {
    logger.error("Database Error", {
      correlationId: getCorrelationId(),
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      query: query?.trim(),
      params,
    });
  },
};

// Convenience methods for different log levels
const log = {
  info: (message, meta = {}) => {
    logger.info(message, {
      correlationId: getCorrelationId(),
      ...meta,
    });
  },

  warn: (message, meta = {}) => {
    logger.warn(message, {
      correlationId: getCorrelationId(),
      ...meta,
    });
  },

  error: (message, error = null, meta = {}) => {
    const logData = {
      correlationId: getCorrelationId(),
      ...meta,
    };

    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      };
    }

    logger.error(message, logData);
  },

  debug: (message, meta = {}) => {
    logger.debug(message, {
      correlationId: getCorrelationId(),
      ...meta,
    });
  },

  performance: (operation, duration, meta = {}) => {
    logger.info(`Performance: ${operation}`, {
      correlationId: getCorrelationId(),
      duration,
      operation,
      ...meta,
    });
  },
};

module.exports = {
  logger,
  log,
  generateCorrelationId,
  setCorrelationId,
  getCorrelationId,
  clearCorrelationId,
  startTimer,
  endTimer,
  requestLogger,
  errorLogger,
  socketLogger,
  dbLogger,
};
