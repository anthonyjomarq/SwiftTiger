// server/utils/logger.js
import { createWriteStream } from "fs";
import { join } from "path";

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.isDevelopment = process.env.NODE_ENV === "development";

    // Create log file stream (optional)
    // this.logStream = createWriteStream(join(process.cwd(), 'logs', 'app.log'), { flags: 'a' });
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length
      ? ` | ${JSON.stringify(meta)}`
      : "";
    return `[${level.toUpperCase()}] ${timestamp} - ${message}${metaString}`;
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output
    if (this.isDevelopment || level === "error") {
      console.log(formattedMessage);
    }

    // File output (uncomment if you want file logging)
    // if (this.logStream) {
    //   this.logStream.write(formattedMessage + '\n');
    // }
  }

  info(message, meta = {}) {
    this.log("info", message, meta);
  }

  error(message, meta = {}) {
    this.log("error", message, meta);

    // Also log to console.error for stack traces
    if (meta.stack) {
      console.error(meta.stack);
    }
  }

  warn(message, meta = {}) {
    this.log("warn", message, meta);
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      this.log("debug", message, meta);
    }
  }
}

export const logger = new Logger();
