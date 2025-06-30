const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { pool, initializeDatabase } = require("./database");
const { requirePermission } = require("./middleware/permissions");
const {
  geocodeAddress,
  updateCustomerCoordinates,
  validateAddress,
  addKnownAddress,
  KNOWN_ADDRESSES,
} = require("./services/geocoding");
const crypto = require("crypto");
const { createServer } = require("http");
const { Server } = require("socket.io");
const authService = require("./services/authService");
const socketService = require("./services/socketService");
const jobService = require("./services/jobService");
const customerService = require("./services/customerService");
const userService = require("./services/userService");
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
require("dotenv").config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let socketHandlers;

const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase().catch(console.error);

// Authentication middleware
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

// Validation middleware
const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").notEmpty().trim(),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

// Routes

// Register user (first user becomes admin)
app.post("/api/auth/register", validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorResponse(errors.array()));
    }

    const result = await userService.createUser(req.body);

    if (!result.success) {
      return sendResponse(res, result);
    }

    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: result.data.id, email: result.data.email, role: result.data.role },
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
    console.error("Registration error:", error);
    res.status(500).json(internalServerErrorResponse());
  }
});

// Login user
app.post("/api/auth/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorResponse(errors.array()));
    }

    const { email, password } = req.body;
    const result = await userService.authenticateUser(email, password);

    sendResponse(res, result);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(internalServerErrorResponse());
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const result = await userService.getCurrentUser(req.user.id);
  sendResponse(res, result);
});

// Get user permissions
app.get("/api/auth/permissions", authenticateToken, async (req, res) => {
  const result = await userService.getUserPermissions(req.user.id);
  sendResponse(res, result);
});

// Get all users (for technician assignment)
app.get(
  "/api/users",
  authenticateToken,
  requirePermission("users.view"),
  async (req, res) => {
    const result = await userService.getUsers();
    sendResponse(res, result);
  }
);

// Customer routes
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
  async (req, res) => {
    const result = await customerService.createCustomer(req.body);
    sendResponse(res, result);
  }
);

app.put(
  "/api/customers/:id",
  authenticateToken,
  requirePermission("customers.edit"),
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
  async (req, res) => {
    const result = await customerService.deleteCustomer(req.params.id);
    sendResponse(res, result);
  }
);

// Manual geocoding endpoint for customer
app.post(
  "/api/customers/:id/geocode",
  authenticateToken,
  requirePermission("customers.edit"),
  async (req, res) => {
    const result = await customerService.geocodeCustomer(req.params.id);
    sendResponse(res, result);
  }
);

// Job routes
app.get("/api/jobs", authenticateToken, async (req, res) => {
  const result = await jobService.getJobs(req.user.id, req.user.role);
  sendResponse(res, result);
});

app.post(
  "/api/jobs",
  authenticateToken,
  requirePermission("jobs.create"),
  async (req, res) => {
    const result = await jobService.createJob(req.body, req.user.id);
    sendResponse(res, result);
  }
);

app.put("/api/jobs/:id", authenticateToken, async (req, res) => {
  const result = await jobService.updateJob(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  sendResponse(res, result);
});

app.delete(
  "/api/jobs/:id",
  authenticateToken,
  requirePermission("jobs.delete"),
  async (req, res) => {
    const result = await jobService.deleteJob(req.params.id, req.user.id);
    sendResponse(res, result);
  }
);

// Job Updates API Routes

// Get updates for a specific job
app.get("/api/jobs/:id/updates", authenticateToken, async (req, res) => {
  const result = await jobService.getJobUpdates(
    req.params.id,
    req.user.id,
    req.user.role
  );
  sendResponse(res, result);
});

// Create a new job update
app.post("/api/jobs/:id/updates", authenticateToken, async (req, res) => {
  const result = await jobService.createJobUpdate(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  sendResponse(res, result);
});

// Get recent activity feed for dashboard
app.get("/api/activity-feed", authenticateToken, async (req, res) => {
  const result = await jobService.getActivityFeed(req.user.id, req.user.role);
  sendResponse(res, result);
});

// Get jobs with location data for mapping
app.get("/api/jobs/map-data", authenticateToken, async (req, res) => {
  const result = await jobService.getJobsMapData(
    req.user.id,
    req.user.role,
    req.query
  );
  sendResponse(res, result);
});

// Original Route optimization endpoint (kept for backward compatibility)
app.post(
  "/api/jobs/optimize-route",
  authenticateToken,
  requirePermission("jobs.assign"),
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

// Advanced Route Optimization endpoint with 2-opt improvement
app.post(
  "/api/jobs/optimize-route-advanced",
  authenticateToken,
  requirePermission("jobs.assign"),
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
app.post("/api/eta/calculate", authenticateToken, async (req, res) => {
  const result = await jobService.calculateEta(req.body);
  sendResponse(res, result);
});

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
    console.error("Token refresh error:", error);
    res.status(401).json(errorResponse("Token refresh failed", 401));
  }
});

// Password reset request
app.post("/api/auth/forgot-password", async (req, res) => {
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
    console.error("Password reset request error:", error);
    // Don't reveal if user exists or not
    res.json(
      successResponse(
        null,
        "If the email exists, a password reset link has been sent"
      )
    );
  }
});

// Password reset
app.post("/api/auth/reset-password", async (req, res) => {
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
    console.error("Password reset error:", error);
    res.status(400).json(errorResponse(error.message, 400));
  }
});

// Email verification request
app.post("/api/auth/send-verification", authenticateToken, async (req, res) => {
  try {
    const verificationToken = await authService.generateEmailVerificationToken(
      req.user.id
    );
    await authService.sendEmailVerification(req.user.email, verificationToken);

    res.json(successResponse(null, "Verification email sent"));
  } catch (error) {
    console.error("Email verification request error:", error);
    res
      .status(500)
      .json(errorResponse("Failed to send verification email", 500));
  }
});

// Email verification
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
    console.error("Email verification error:", error);
    res.status(400).json(errorResponse(error.message, 400));
  }
});

// Logout (invalidate session)
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"];

    if (sessionId) {
      await authService.invalidateSession(sessionId);
    }

    res.json(successResponse(null, "Logged out successfully"));
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json(errorResponse("Logout failed", 500));
  }
});

// Get user sessions
app.get("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    const sessions = await authService.getUserSessions(req.user.id);
    res.json(successResponse({ sessions }, "Sessions retrieved successfully"));
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json(errorResponse("Failed to get sessions", 500));
  }
});

// Invalidate specific session
app.delete(
  "/api/auth/sessions/:sessionId",
  authenticateToken,
  async (req, res) => {
    try {
      await authService.invalidateSession(req.params.sessionId);
      res.json(successResponse(null, "Session invalidated"));
    } catch (error) {
      console.error("Session invalidation error:", error);
      res.status(500).json(errorResponse("Failed to invalidate session", 500));
    }
  }
);

// Invalidate all user sessions
app.delete("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    await authService.invalidateAllUserSessions(req.user.id);
    res.json(successResponse(null, "All sessions invalidated"));
  } catch (error) {
    console.error("Sessions invalidation error:", error);
    res.status(500).json(errorResponse("Failed to invalidate sessions", 500));
  }
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Initialize handlers if not already done
  if (!socketService.getHandlers()) {
    socketService.initialize(io);
  }

  // Join technician room for location updates
  socket.on("join_technician_room", (technicianId) => {
    socket.join(`technician_${technicianId}`);
    console.log(`Client ${socket.id} joined technician room: ${technicianId}`);
  });

  // Join route room for real-time updates
  socket.on("join_route_room", (routeId) => {
    socket.join(`route_${routeId}`);
    console.log(`Client ${socket.id} joined route room: ${routeId}`);
  });

  // Handle route updates
  socket.on("route_update", (data) => {
    io.to(`route_${data.routeId}`).emit("route_updated", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Get notifications
app.get("/api/notifications", authenticateToken, async (req, res) => {
  const result = await userService.getNotifications(req.user.id);
  sendResponse(res, result);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io, socketService };
