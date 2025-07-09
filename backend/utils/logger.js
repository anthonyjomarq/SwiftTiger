const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');

// Configure log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create transports
const transports = [];

// Console transport (always active in development)
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  );

  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  );

  // Console for production (errors only)
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'error'
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'swifttiger-api' },
  transports,
  exitOnError: false
});

// Add request logging helper
logger.logRequest = (req, res, message = 'Request processed') => {
  const meta = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    statusCode: res.statusCode,
    responseTime: res.get('X-Response-Time')
  };

  if (res.statusCode >= 400) {
    logger.error(message, meta);
  } else {
    logger.info(message, meta);
  }
};

// Add error logging helper
logger.logError = (error, req = null, additionalMeta = {}) => {
  const meta = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...additionalMeta
  };

  if (req) {
    meta.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.method !== 'GET' ? req.body : undefined,
      params: req.params,
      query: req.query
    };
  }

  logger.error('Application error', meta);
};

// Add audit logging helper
logger.logAudit = (action, resource, user, details = {}) => {
  logger.info('Audit log', {
    audit: {
      action,
      resource,
      userId: user.id,
      userEmail: user.email,
      ip: user.ipAddress,
      userAgent: user.userAgent,
      details
    }
  });
};

module.exports = logger;