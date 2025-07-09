# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S swifttiger -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs uploads

# Set ownership of application files
RUN chown -R swifttiger:nodejs /app

# Switch to non-root user
USER swifttiger

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
  const options = { hostname: 'localhost', port: 5000, path: '/api/health', timeout: 2000 }; \
  const req = http.request(options, (res) => { \
    console.log(\`Health check status: \${res.statusCode}\`); \
    process.exit(res.statusCode === 200 ? 0 : 1); \
  }); \
  req.on('timeout', () => { req.destroy(); process.exit(1); }); \
  req.on('error', () => process.exit(1)); \
  req.end();"

# Start the application
CMD ["npm", "start"]