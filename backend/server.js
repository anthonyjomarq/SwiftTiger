/**
 * SwiftTiger Backend Server
 * Main Express.js server with authentication, job management, and real-time features
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */

// External libraries
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Validate environment variables before starting server
const { validateAndExit } = require("./utils/envValidator");

// Database and middleware
const { pool, initializeDatabase } = require("./database");
const { requirePermission } = require("./middleware/permissions");
const {
  handleValidationErrors,
  sanitizeRequest,
} = require("./middleware/validation");
const {
  validateJobWorkflow,
  validateJobAssignment,
} = require("./middleware/jobWorkflow");

// Validators
const {
  validateCreateJob,
  validateUpdateJob,
  validateJobStatus,
  validateJobId,
  validateJobUpdate,
  validateJobNoteUpdate,
  validateNotePinToggle,
  validateRouteOptimization,
  validateEtaCalculation,
} = require("./validators/jobValidator");
const {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCustomerId,
  validateCustomerGeocoding,
} = require("./validators/customerValidator");

// Services
const {
  geocodeAddress,
  updateCustomerCoordinates,
  validateAddress,
  addKnownAddress,
  KNOWN_ADDRESSES,
} = require("./services/geocoding");
const authService = require("./services/authService");
const socketService = require("./services/socketService");
const jobService = require("./services/jobService");
const customerService = require("./services/customerService");
const userService = require("./services/userService");

// Utilities
const {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalServerErrorResponse,
  sendResponse,
} = require("./utils/apiResponse");
const {
  log,
  requestLogger,
  errorLogger,
  socketLogger,
} = require("./utils/logger");

/**
 * Express application instance
 */
const app = express();

/**
 * HTTP server instance
 */
const server = createServer(app);

/**
 * Socket.IO server instance with CORS configuration
 */
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/**
 * Socket handlers reference for real-time communication
 */
let socketHandlers;

/**
 * Server configuration constants
 */
const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Rate limiting configuration
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later",
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later",
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    error: "Rate limit exceeded, please slow down",
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * CORS configuration with environment-based origins
 */
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

/**
 * Global middleware configuration
 */
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Add request logging middleware
app.use(requestLogger);

/**
 * Validate environment variables before starting
 */
validateAndExit();

/**
 * Initialize database connection and tables
 */
initializeDatabase().catch((error) => {
  log.error("Database initialization failed", error);
});

/**
 * JWT authentication middleware
 * Validates JWT tokens from Authorization header
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json(unauthorizedResponse());
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json(forbiddenResponse());
    }
    req.user = user;
    next();
  });
};

/**
 * Validation middleware for user registration
 */
const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").notEmpty().trim(),
];

/**
 * Validation middleware for user login
 */
const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get("/api/health", async (req, res) => {
  try {
    // Check database connectivity
    const dbResult = await pool.query("SELECT 1 as healthy");
    const dbHealthy = dbResult.rows[0]?.healthy === 1;
    
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: dbHealthy ? "healthy" : "unhealthy",
        server: "healthy"
      }
    };
    
    res.status(200).json(health);
  } catch (error) {
    log.error("Health check failed", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed"
    });
  }
});

/**
 * API Routes
 */

/**
 * Register new user (first user becomes admin)
 * POST /api/auth/register
 */
app.post(
  "/api/auth/register",
  authLimiter,
  sanitizeRequest,
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await userService.createUser(req.body);

      if (!result.success) {
        return sendResponse(res, result);
      }

      // Generate JWT token for the new user
      const token = jwt.sign(
        {
          id: result.data.id,
          email: result.data.email,
          role: result.data.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Create a new response with token included
      const responseWithToken = {
        ...result,
        data: {
          token,
          user: result.data,
        },
      };

      sendResponse(res, responseWithToken);
    } catch (error) {
      log.error("Registration error", error);
      res.status(500).json(internalServerErrorResponse());
    }
  }
);

/**
 * Login user
 * POST /api/auth/login
 */
app.post(
  "/api/auth/login",
  authLimiter,
  sanitizeRequest,
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await userService.authenticateUser(email, password);

      sendResponse(res, result);
    } catch (error) {
      log.error("Login error", error);
      res.status(500).json(internalServerErrorResponse());
    }
  }
);

/**
 * Get current user information
 * GET /api/auth/me
 */
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const result = await userService.getCurrentUser(req.user.id);
  sendResponse(res, result);
});

/**
 * Get user permissions
 * GET /api/auth/permissions
 */
app.get("/api/auth/permissions", authenticateToken, async (req, res) => {
  const result = await userService.getUserPermissions(req.user.id);
  sendResponse(res, result);
});

/**
 * Get all users (for technician assignment)
 * GET /api/users
 */
app.get(
  "/api/users",
  authenticateToken,
  requirePermission("users.view"),
  async (req, res) => {
    const result = await userService.getUsers();
    sendResponse(res, result);
  }
);

/**
 * Customer Routes
 */

/**
 * Get all customers
 * GET /api/customers
 */
app.get(
  "/api/customers",
  authenticateToken,
  requirePermission("customers.view"),
  async (req, res) => {
    const result = await customerService.getCustomers();
    sendResponse(res, result);
  }
);

app.post(
  "/api/customers",
  authenticateToken,
  requirePermission("customers.create"),
  sanitizeRequest,
  validateCreateCustomer,
  handleValidationErrors,
  async (req, res) => {
    const result = await customerService.createCustomer(req.body);
    sendResponse(res, result);
  }
);

app.put(
  "/api/customers/:id",
  authenticateToken,
  requirePermission("customers.edit"),
  sanitizeRequest,
  validateUpdateCustomer,
  handleValidationErrors,
  async (req, res) => {
    const result = await customerService.updateCustomer(
      req.params.id,
      req.body
    );
    sendResponse(res, result);
  }
);

app.delete(
  "/api/customers/:id",
  authenticateToken,
  requirePermission("customers.delete"),
  validateCustomerId,
  handleValidationErrors,
  async (req, res) => {
    const result = await customerService.deleteCustomer(req.params.id);
    sendResponse(res, result);
  }
);

/**
 * Manual geocoding endpoint for customer
 * POST /api/customers/:id/geocode
 */
app.post(
  "/api/customers/:id/geocode",
  authenticateToken,
  requirePermission("customers.edit"),
  validateCustomerGeocoding,
  handleValidationErrors,
  async (req, res) => {
    const result = await customerService.geocodeCustomer(req.params.id);
    sendResponse(res, result);
  }
);

/**
 * Job Routes
 */

/**
 * Get all jobs (filtered by user role)
 * GET /api/jobs
 */
app.get("/api/jobs", authenticateToken, async (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.priority) filters.priority = req.query.priority;
  
  const result = await jobService.getJobs(req.user.id, req.user.role, filters);
  sendResponse(res, result);
});

app.post(
  "/api/jobs",
  authenticateToken,
  requirePermission("jobs.create"),
  sanitizeRequest,
  validateCreateJob,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.createJob(req.body, req.user.id);
    sendResponse(res, result);
  }
);

app.put(
  "/api/jobs/:id",
  authenticateToken,
  sanitizeRequest,
  validateUpdateJob,
  handleValidationErrors,
  validateJobWorkflow,
  validateJobAssignment,
  async (req, res) => {
    const result = await jobService.updateJob(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
      req.workflowContext // Pass workflow context from middleware
    );
    sendResponse(res, result);
  }
);

app.delete(
  "/api/jobs/:id",
  authenticateToken,
  requirePermission("jobs.delete"),
  validateJobId,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.deleteJob(req.params.id, req.user.id);
    sendResponse(res, result);
  }
);

/**
 * Get available status transitions for a job
 * GET /api/jobs/:id/transitions
 */
app.get(
  "/api/jobs/:id/transitions",
  authenticateToken,
  validateJobId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const jobId = req.params.id;
      const userRole = req.user.role;

      // Get current job data
      const jobResult = await pool.query(
        'SELECT status FROM jobs WHERE id = $1',
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      const currentStatus = jobResult.rows[0].status;
      const { getAvailableTransitions, WORKFLOW_CONFIG } = require('./middleware/jobWorkflow');
      const availableTransitions = getAvailableTransitions(currentStatus, userRole);

      res.json({
        success: true,
        data: {
          currentStatus,
          availableTransitions,
          userRole,
          requiresComment: WORKFLOW_CONFIG.REQUIRES_COMMENT,
          requiresAssignment: WORKFLOW_CONFIG.REQUIRES_ASSIGNMENT
        }
      });
    } catch (error) {
      log.error('Get job transitions error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available transitions'
      });
    }
  }
);

/**
 * Get workflow analytics for a job
 * GET /api/jobs/:id/workflow
 */
app.get(
  "/api/jobs/:id/workflow",
  authenticateToken,
  validateJobId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { getJobWorkflowAnalytics } = require('./middleware/jobWorkflow');
      const result = await getJobWorkflowAnalytics(req.params.id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      log.error('Get workflow analytics error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow analytics'
      });
    }
  }
);

/**
 * Get job status history
 * GET /api/jobs/:id/history
 */
app.get(
  "/api/jobs/:id/history",
  authenticateToken,
  validateJobId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const jobId = req.params.id;
      
      const historyResult = await pool.query(`
        SELECT 
          jsh.*,
          u.name as changed_by_name,
          u.role as changed_by_role
        FROM job_status_history jsh
        LEFT JOIN users u ON jsh.changed_by = u.id
        WHERE job_id = $1
        ORDER BY changed_at DESC
      `, [jobId]);
      
      res.json({
        success: true,
        data: historyResult.rows
      });
    } catch (error) {
      log.error('Get job history error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job history'
      });
    }
  }
);

/**
 * Job Updates API Routes
 */

/**
 * Get updates for a specific job
 * GET /api/jobs/:id/updates
 */
app.get(
  "/api/jobs/:id/updates",
  authenticateToken,
  validateJobId,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.getJobUpdates(
      req.params.id,
      req.user.id,
      req.user.role
    );
    sendResponse(res, result);
  }
);

/**
 * Create a new job update
 * POST /api/jobs/:id/updates
 */
app.post(
  "/api/jobs/:id/updates",
  authenticateToken,
  sanitizeRequest,
  validateJobUpdate,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.createJobUpdate(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    sendResponse(res, result);
  }
);

/**
 * Update a job note/comment
 * PUT /api/jobs/:id/updates/:updateId
 */
app.put(
  "/api/jobs/:id/updates/:updateId",
  authenticateToken,
  sanitizeRequest,
  validateJobNoteUpdate,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.updateJobNote(
      req.params.id,
      req.params.updateId,
      req.body,
      req.user.id,
      req.user.role
    );
    sendResponse(res, result);
  }
);

/**
 * Delete a job note/comment
 * DELETE /api/jobs/:id/updates/:updateId
 */
app.delete(
  "/api/jobs/:id/updates/:updateId",
  authenticateToken,
  async (req, res) => {
    const result = await jobService.deleteJobNote(
      req.params.id,
      req.params.updateId,
      req.user.id,
      req.user.role
    );
    sendResponse(res, result);
  }
);

/**
 * Pin/unpin a job note
 * PATCH /api/jobs/:id/updates/:updateId/pin
 */
app.patch(
  "/api/jobs/:id/updates/:updateId/pin",
  authenticateToken,
  validateNotePinToggle,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.toggleNotePin(
      req.params.id,
      req.params.updateId,
      req.body.is_pinned,
      req.user.id,
      req.user.role
    );
    sendResponse(res, result);
  }
);

/**
 * Get recent activity feed for dashboard
 * GET /api/activity-feed
 */
app.get("/api/activity-feed", authenticateToken, async (req, res) => {
  const result = await jobService.getActivityFeed(req.user.id, req.user.role);
  sendResponse(res, result);
});

/**
 * Get jobs with location data for mapping
 * GET /api/jobs/map-data
 */
app.get("/api/jobs/map-data", authenticateToken, async (req, res) => {
  const result = await jobService.getJobsMapData(
    req.user.id,
    req.user.role,
    req.query
  );
  sendResponse(res, result);
});

/**
 * Original Route optimization endpoint (kept for backward compatibility)
 * POST /api/jobs/optimize-route
 */
app.post(
  "/api/jobs/optimize-route",
  authenticateToken,
  requirePermission("jobs.assign"),
  sanitizeRequest,
  validateRouteOptimization,
  handleValidationErrors,
  async (req, res) => {
    const { job_ids, start_location, end_location } = req.body;
    const result = await jobService.optimizeRoute(
      job_ids,
      start_location,
      end_location
    );
    sendResponse(res, result);
  }
);

/**
 * Advanced Route Optimization endpoint with 2-opt improvement
 * POST /api/jobs/optimize-route-advanced
 */
app.post(
  "/api/jobs/optimize-route-advanced",
  authenticateToken,
  requirePermission("jobs.assign"),
  sanitizeRequest,
  validateRouteOptimization,
  handleValidationErrors,
  async (req, res) => {
    const {
      job_ids,
      start_location,
      optimization_type,
      consider_traffic,
      time_windows,
    } = req.body;
    const result = await jobService.optimizeRouteAdvanced(
      job_ids,
      start_location,
      optimization_type,
      consider_traffic,
      time_windows
    );
    sendResponse(res, result);
  }
);

// Dashboard stats
app.get("/api/dashboard", authenticateToken, async (req, res) => {
  const result = await jobService.getDashboardStats();
  sendResponse(res, result);
});

// Debug endpoint to show all jobs (for troubleshooting)
app.get("/api/jobs/debug", authenticateToken, async (req, res) => {
  const result = await jobService.getDebugJobs();
  sendResponse(res, result);
});

// ===== REAL-TIME FEATURES =====

// Real-time technician location tracking
app.post(
  "/api/technicians/:id/location",
  authenticateToken,
  async (req, res) => {
    const result = await userService.updateTechnicianLocation(
      req.params.id,
      req.body
    );
    sendResponse(res, result);
  }
);

// Get technician locations
app.get("/api/technicians/locations", authenticateToken, async (req, res) => {
  const result = await userService.getTechnicianLocations();
  sendResponse(res, result);
});

// Route sharing functionality
app.post("/api/routes/share", authenticateToken, async (req, res) => {
  const result = await jobService.shareRoute(req.user.id, req.body);
  sendResponse(res, result);
});

app.get("/api/routes/shared/:token", async (req, res) => {
  const result = await jobService.getSharedRoute(req.params.token);
  sendResponse(res, result);
});

// ETA calculation with traffic
app.post(
  "/api/eta/calculate",
  authenticateToken,
  sanitizeRequest,
  validateEtaCalculation,
  handleValidationErrors,
  async (req, res) => {
    const result = await jobService.calculateEta(req.body);
    sendResponse(res, result);
  }
);

// Enhanced Authentication Routes

// Refresh token endpoint
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(errorResponse("Refresh token required"));
    }

    const { accessToken, user } = await authService.refreshAccessToken(
      refreshToken
    );

    res.json(
      successResponse(
        {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        "Token refreshed successfully"
      )
    );
  } catch (error) {
    log.error("Token refresh error", error);
    res.status(401).json(errorResponse("Token refresh failed", 401));
  }
});

/**
 * Password reset request
 * POST /api/auth/forgot-password
 */
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(errorResponse("Email required"));
    }

    const { resetToken, user } = await authService.generatePasswordResetToken(
      email
    );
    await authService.sendPasswordResetEmail(email, resetToken);

    res.json(
      successResponse(
        {
          email: user.email, // Return email for confirmation
        },
        "Password reset email sent"
      )
    );
  } catch (error) {
    log.error("Password reset request error", error);
    // Don't reveal if user exists or not
    res.json(
      successResponse(
        null,
        "If the email exists, a password reset link has been sent"
      )
    );
  }
});

/**
 * Password reset
 * POST /api/auth/reset-password
 */
app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res
        .status(400)
        .json(errorResponse("Email, reset token, and new password required"));
    }

    await authService.resetPassword(email, resetToken, newPassword);

    res.json(successResponse(null, "Password reset successfully"));
  } catch (error) {
    log.error("Password reset error", error);
    res.status(400).json(errorResponse(error.message, 400));
  }
});

/**
 * Email verification request
 * POST /api/auth/send-verification
 */
app.post("/api/auth/send-verification", authenticateToken, async (req, res) => {
  try {
    const verificationToken = await authService.generateEmailVerificationToken(
      req.user.id
    );
    await authService.sendEmailVerification(req.user.email, verificationToken);

    res.json(successResponse(null, "Verification email sent"));
  } catch (error) {
    log.error("Email verification request error", error);
    res
      .status(500)
      .json(errorResponse("Failed to send verification email", 500));
  }
});

/**
 * Email verification
 * POST /api/auth/verify-email
 */
app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { userId, verificationToken } = req.body;

    if (!userId || !verificationToken) {
      return res
        .status(400)
        .json(errorResponse("User ID and verification token required"));
    }

    await authService.verifyEmail(userId, verificationToken);

    res.json(successResponse(null, "Email verified successfully"));
  } catch (error) {
    log.error("Email verification error", error);
    res.status(400).json(errorResponse(error.message, 400));
  }
});

/**
 * Logout (invalidate session)
 * POST /api/auth/logout
 */
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"];

    if (sessionId) {
      await authService.invalidateSession(sessionId);
    }

    res.json(successResponse(null, "Logged out successfully"));
  } catch (error) {
    log.error("Logout error", error);
    res.status(500).json(errorResponse("Logout failed", 500));
  }
});

/**
 * Get user sessions
 * GET /api/auth/sessions
 */
app.get("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    const sessions = await authService.getUserSessions(req.user.id);
    res.json(successResponse({ sessions }, "Sessions retrieved successfully"));
  } catch (error) {
    log.error("Get sessions error", error);
    res.status(500).json(errorResponse("Failed to get sessions", 500));
  }
});

/**
 * Invalidate specific session
 * DELETE /api/auth/sessions/:sessionId
 */
app.delete(
  "/api/auth/sessions/:sessionId",
  authenticateToken,
  async (req, res) => {
    try {
      await authService.invalidateSession(req.params.sessionId);
      res.json(successResponse(null, "Session invalidated"));
    } catch (error) {
      log.error("Session invalidation error", error);
      res.status(500).json(errorResponse("Failed to invalidate session", 500));
    }
  }
);

/**
 * Invalidate all user sessions
 * DELETE /api/auth/sessions
 */
app.delete("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    await authService.invalidateAllUserSessions(req.user.id);
    res.json(successResponse(null, "All sessions invalidated"));
  } catch (error) {
    log.error("Sessions invalidation error", error);
    res.status(500).json(errorResponse("Failed to invalidate sessions", 500));
  }
});

/**
 * WebSocket connection handling
 * Manages real-time communication for job updates and location tracking
 */
io.on("connection", (socket) => {
  // Apply socket logging middleware
  socketLogger(socket, () => {
    // Initialize handlers if not already done
    if (!socketService.getHandlers()) {
      socketService.initialize(io);
    }

    // Join technician room for location updates
    socket.on("join_technician_room", (technicianId) => {
      socket.join(`technician_${technicianId}`);
      log.info(`Client joined technician room`, {
        socketId: socket.id,
        technicianId,
        userId: socket.userId || "anonymous",
      });
    });

    // Join route room for real-time updates
    socket.on("join_route_room", (routeId) => {
      socket.join(`route_${routeId}`);
      log.info(`Client joined route room`, {
        socketId: socket.id,
        routeId,
        userId: socket.userId || "anonymous",
      });
    });

    // Handle route updates
    socket.on("route_update", (data) => {
      io.to(`route_${data.routeId}`).emit("route_updated", data);
    });
  });
});

/**
 * Get notifications
 * GET /api/notifications
 */
app.get("/api/notifications", authenticateToken, async (req, res) => {
  const result = await userService.getNotifications(req.user.id);
  sendResponse(res, result);
});

/**
 * Error handling middleware (must be last)
 */
app.use(errorLogger);

/**
 * Start the server and listen on specified port
 */
server.listen(PORT, () => {
  log.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Export server components for testing and external use
 */
module.exports = { app, server, io, socketService };
