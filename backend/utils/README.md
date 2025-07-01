# Logging System Documentation

## Overview

The SwiftTiger backend uses Winston for comprehensive logging with the following features:

- **Multiple log levels**: info, warn, error, debug
- **File and console transports**: Logs to both console and files
- **Request/response logging**: Automatic HTTP request/response logging with correlation IDs
- **Error stack traces**: Full error details with stack traces
- **Performance metrics**: Built-in performance tracking
- **Correlation IDs**: Request tracking across the entire application

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set logging level (default: 'info')
  - Options: error, warn, info, debug
- `NODE_ENV`: Environment (development, production, etc.)

### Log Files

Logs are stored in the `backend/logs/` directory:

- `combined.log`: All logs
- `error.log`: Error logs only
- `performance.log`: Performance metrics
- `exceptions.log`: Unhandled exceptions
- `rejections.log`: Unhandled promise rejections

## Usage

### Basic Logging

```javascript
const { log } = require("./utils/logger");

// Info logging
log.info("User logged in", { userId: 123, email: "user@example.com" });

// Warning logging
log.warn("Database connection slow", { duration: 1500 });

// Error logging
log.error("Failed to process payment", error, { orderId: 456 });

// Debug logging
log.debug("Processing request", { method: "POST", url: "/api/users" });
```

### Performance Tracking

```javascript
const { startTimer, endTimer } = require("./utils/logger");

// Start timing an operation
const timerId = startTimer("database_query");

// ... perform operation ...

// End timing and log
const duration = endTimer(timerId, { query: "SELECT * FROM users" });
```

### Request Logging

The `requestLogger` middleware automatically logs all HTTP requests and responses:

```javascript
const { requestLogger } = require("./utils/logger");

app.use(requestLogger);
```

### Error Logging

The `errorLogger` middleware catches and logs unhandled errors:

```javascript
const { errorLogger } = require("./utils/logger");

// Must be last middleware
app.use(errorLogger);
```

### Socket Logging

```javascript
const { socketLogger } = require("./utils/logger");

io.on("connection", (socket) => {
  socketLogger(socket, () => {
    // Socket event handlers
  });
});
```

### Database Query Logging

Database queries are automatically logged when:

- `LOG_LEVEL` is set to 'debug'
- Query duration exceeds 1000ms

## Correlation IDs

Every request gets a unique correlation ID that's:

- Generated automatically for each request
- Included in all log entries for that request
- Added to response headers as `X-Correlation-ID`
- Available throughout the request lifecycle

### Accessing Correlation ID

```javascript
const { getCorrelationId } = require("./utils/logger");

const correlationId = getCorrelationId();
```

## Log Format

### Console Output (Development)

```
2024-01-15 10:30:45 [info]: User logged in [abc123-def456] (150ms) {"userId":123,"email":"user@example.com"}
```

### File Output (JSON)

```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "User logged in",
  "correlationId": "abc123-def456",
  "duration": 150,
  "userId": 123,
  "email": "user@example.com",
  "service": "swift-tiger-backend",
  "version": "1.0.0"
}
```

## Best Practices

1. **Use structured logging**: Always include relevant context as metadata
2. **Log at appropriate levels**:

   - `error`: Errors that need immediate attention
   - `warn`: Issues that should be investigated
   - `info`: Important business events
   - `debug`: Detailed information for troubleshooting

3. **Include correlation IDs**: All log entries automatically include correlation IDs

4. **Performance tracking**: Use `startTimer`/`endTimer` for slow operations

5. **Error context**: Always include relevant context when logging errors

## Migration from console.log

Replace console.log/error calls:

```javascript
// Before
console.log("User connected:", userId);
console.error("Database error:", error);

// After
log.info("User connected", { userId });
log.error("Database error", error, { userId });
```

## Monitoring and Alerting

The logging system supports integration with monitoring tools:

- **Error tracking**: All errors are logged with full context
- **Performance monitoring**: Slow operations are automatically logged
- **Request tracing**: Full request/response cycle tracking
- **Correlation IDs**: Easy request tracing across services

## File Rotation

Log files are automatically rotated:

- Maximum file size: 5MB
- Maximum files: 5 (combined, error) / 3 (performance)
- Old files are automatically deleted
