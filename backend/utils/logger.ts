/**
 * Winston logger configuration with TypeScript support
 * Provides structured logging with request, error, and audit helpers
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import process from "process";
import type { Request, Response } from "express";

export interface AuthenticatedRequest extends Omit<Request, "user"> {
  user?: {
    id: string | number;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface LogMeta {
  [key: string]: unknown;
}

export interface RequestMeta extends LogMeta {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string | number;
  statusCode: number;
  responseTime?: string;
}

export interface ErrorMeta extends LogMeta {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    userId?: string | number;
    body?: unknown;
    params?: unknown;
    query?: unknown;
  };
}

export interface AuditMeta extends LogMeta {
  audit: {
    action: string;
    resource: string;
    userId: string | number;
    userEmail?: string;
    ip?: string;
    userAgent?: string;
    details?: { [key: string]: unknown };
  };
}

export interface LoggerHelpers {
  logRequest(req: AuthenticatedRequest, res: Response, message?: string): void;
  logError(
    error: Error,
    req?: AuthenticatedRequest | null,
    additionalMeta?: LogMeta
  ): void;
  logAudit(
    action: string,
    resource: string,
    user: {
      id: string | number;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    details?: { [key: string]: unknown }
  ): void;
}

export type Logger = winston.Logger & LoggerHelpers;

const logsDir = path.join(__dirname, "../logs");

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
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

function createTransports(): winston.transport[] {
  const transports: winston.transport[] = [];

  if (process.env.NODE_ENV === "development") {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: "debug",
      })
    );
  }

  if (process.env.NODE_ENV === "production") {
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, "error-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "error",
        format: logFormat,
        maxSize: "20m",
        maxFiles: "14d",
        zippedArchive: true,
      })
    );

    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, "combined-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        format: logFormat,
        maxSize: "20m",
        maxFiles: "30d",
        zippedArchive: true,
      })
    );

    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: "error",
      })
    );
  }

  return transports;
}

function getLogLevel(): string {
  return (
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug")
  );
}

function getUserAgent(req: Request | AuthenticatedRequest): string | undefined {
  return req.get("User-Agent");
}

function getResponseTime(res: Response): string | undefined {
  return res.get("X-Response-Time");
}

function createBaseLogger(): winston.Logger {
  return winston.createLogger({
    level: getLogLevel(),
    format: logFormat,
    defaultMeta: { service: "swifttiger-api" },
    transports: createTransports(),
    exitOnError: false,
  });
}

function addLoggerHelpers(baseLogger: winston.Logger): Logger {
  const logger = baseLogger as Logger;

  logger.logRequest = (
    req: AuthenticatedRequest,
    res: Response,
    message: string = "Request processed"
  ): void => {
    const meta: RequestMeta = {
      method: req.method,
      url: req.url,
      ip: req.ip || "unknown",
      userAgent: getUserAgent(req),
      userId: req.user?.id,
      statusCode: res.statusCode,
      responseTime: getResponseTime(res),
    };

    if (res.statusCode >= 400) {
      logger.error(message, meta);
    } else {
      logger.info(message, meta);
    }
  };

  logger.logError = (
    error: Error,
    req: AuthenticatedRequest | null = null,
    additionalMeta: LogMeta = {}
  ): void => {
    const meta: ErrorMeta = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalMeta,
    };

    if (req) {
      meta.request = {
        method: req.method,
        url: req.url,
        ip: req.ip || "unknown",
        userAgent: getUserAgent(req),
        userId: req.user?.id,
        body: req.method !== "GET" ? req.body : undefined,
        params: req.params,
        query: req.query,
      };
    }

    logger.error("Application error", meta);
  };

  logger.logAudit = (
    action: string,
    resource: string,
    user: {
      id: string | number;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    details: Record<string, any> = {}
  ): void => {
    const meta: AuditMeta = {
      audit: {
        action,
        resource,
        userId: user.id,
        userEmail: user.email,
        ip: user.ipAddress,
        userAgent: user.userAgent,
        details,
      },
    };

    logger.info("Audit log", meta);
  };

  return logger;
}

function createLogger(): Logger {
  const baseLogger = createBaseLogger();
  return addLoggerHelpers(baseLogger);
}

export const logger = createLogger();

export default logger;
