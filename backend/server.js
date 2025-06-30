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
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
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
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await userService.createUser(req.body);

    if (!result.success) {
      return res.status(result.statusCode).json({ error: result.error });
    }

    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: result.data.id, email: result.data.email, role: result.data.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: result.data,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
app.post("/api/auth/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await userService.authenticateUser(email, password);

    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const result = await userService.getCurrentUser(req.user.id);
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

// Get user permissions
app.get("/api/auth/permissions", authenticateToken, async (req, res) => {
  const result = await userService.getUserPermissions(req.user.id);
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

// Get all users (for technician assignment)
app.get(
  "/api/users",
  authenticateToken,
  requirePermission("users.view"),
  async (req, res) => {
    const result = await userService.getUsers();
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  }
);

// Customer routes
app.get(
  "/api/customers",
  authenticateToken,
  requirePermission("customers.view"),
  async (req, res) => {
    const result = await customerService.getCustomers();
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  }
);

app.post(
  "/api/customers",
  authenticateToken,
  requirePermission("customers.create"),
  async (req, res) => {
    const result = await customerService.createCustomer(req.body);
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
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
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  }
);

app.delete(
  "/api/customers/:id",
  authenticateToken,
  requirePermission("customers.delete"),
  async (req, res) => {
    const result = await customerService.deleteCustomer(req.params.id);
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  }
);

// Manual geocoding endpoint for customer
app.post(
  "/api/customers/:id/geocode",
  authenticateToken,
  requirePermission("customers.edit"),
  async (req, res) => {
    const result = await customerService.geocodeCustomer(req.params.id);
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  }
);

// Job routes
app.get("/api/jobs", authenticateToken, async (req, res) => {
  const result = await jobService.getJobs(req.user.id, req.user.role);
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

app.post(
  "/api/jobs",
  authenticateToken,
  requirePermission("jobs.create"),
  async (req, res) => {
    const result = await jobService.createJob(req.body, req.user.id);
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
  }
);

app.put("/api/jobs/:id", authenticateToken, async (req, res) => {
  const result = await jobService.updateJob(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

app.delete(
  "/api/jobs/:id",
  authenticateToken,
  requirePermission("jobs.delete"),
  async (req, res) => {
    const result = await jobService.deleteJob(req.params.id, req.user.id);
    res
      .status(result.statusCode)
      .json(result.success ? result.data : { error: result.error });
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
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

// Create a new job update
app.post("/api/jobs/:id/updates", authenticateToken, async (req, res) => {
  const result = await jobService.createJobUpdate(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

// Get recent activity feed for dashboard
app.get("/api/activity-feed", authenticateToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === "technician") {
      // Technicians only see updates for their assigned jobs
      query = `
        SELECT 
          ju.*,
          u.name as user_name,
          u.role as user_role,
          j.title as job_title,
          c.name as customer_name
        FROM job_updates ju
        JOIN users u ON ju.user_id = u.id
        JOIN jobs j ON ju.job_id = j.id
        LEFT JOIN customers c ON j.customer_id = c.id
        WHERE j.assigned_to = $1
        ORDER BY ju.created_at DESC
        LIMIT 20
      `;
      params = [req.user.id];
    } else {
      // Admin and Dispatcher see all updates
      query = `
        SELECT 
          ju.*,
          u.name as user_name,
          u.role as user_role,
          j.title as job_title,
          c.name as customer_name
        FROM job_updates ju
        JOIN users u ON ju.user_id = u.id
        JOIN jobs j ON ju.job_id = j.id
        LEFT JOIN customers c ON j.customer_id = c.id
        ORDER BY ju.created_at DESC
        LIMIT 20
      `;
    }

    const updates = await pool.query(query, params);
    res.json({ updates: updates.rows });
  } catch (error) {
    console.error("Get activity feed error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get jobs with location data for mapping
app.get("/api/jobs/map-data", authenticateToken, async (req, res) => {
  const result = await jobService.getJobsMapData(
    req.user.id,
    req.user.role,
    req.query
  );
  res
    .status(result.statusCode)
    .json(result.success ? result.data : { error: result.error });
});

// Original Route optimization endpoint (kept for backward compatibility)
app.post(
  "/api/jobs/optimize-route",
  authenticateToken,
  requirePermission("jobs.assign"),
  async (req, res) => {
    try {
      const { job_ids, start_location, end_location } = req.body;

      if (!job_ids || job_ids.length === 0) {
        return res
          .status(400)
          .json({ error: "No jobs selected for optimization" });
      }

      // Get job locations
      const jobsResult = await pool.query(
        `SELECT j.id, c.latitude, c.longitude, c.address
       FROM jobs j
       JOIN customers c ON j.customer_id = c.id
       WHERE j.id = ANY($1::int[])
       AND c.latitude IS NOT NULL
       AND c.longitude IS NOT NULL`,
        [job_ids]
      );

      const jobs = jobsResult.rows;

      if (jobs.length < 2) {
        return res.json({ optimized_order: job_ids });
      }

      // Enhanced nearest neighbor algorithm with start/end points
      const optimizedOrder = [];
      const unvisited = [...jobs];

      // Use provided start location or default to first job
      let currentLocation = start_location || {
        latitude: jobs[0].latitude,
        longitude: jobs[0].longitude,
      };

      // Find optimal route through all jobs
      while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        unvisited.forEach((job, index) => {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            job.latitude,
            job.longitude
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        const nearest = unvisited.splice(nearestIndex, 1)[0];
        optimizedOrder.push(nearest.id);
        currentLocation = {
          latitude: nearest.latitude,
          longitude: nearest.longitude,
        };
      }

      // Calculate total distance including return to end location
      let totalDistance = 0;
      let routeLocation = start_location || {
        latitude: jobs[0].latitude,
        longitude: jobs[0].longitude,
      };

      // Add distance from start to first job
      if (start_location && optimizedOrder.length > 0) {
        const firstJob = jobs.find((j) => j.id === optimizedOrder[0]);
        totalDistance += calculateDistance(
          start_location.latitude,
          start_location.longitude,
          firstJob.latitude,
          firstJob.longitude
        );
      }

      // Add distances between jobs
      for (let i = 0; i < optimizedOrder.length - 1; i++) {
        const currentJob = jobs.find((j) => j.id === optimizedOrder[i]);
        const nextJob = jobs.find((j) => j.id === optimizedOrder[i + 1]);
        totalDistance += calculateDistance(
          currentJob.latitude,
          currentJob.longitude,
          nextJob.latitude,
          nextJob.longitude
        );
      }

      // Add distance from last job to end location
      if (end_location && optimizedOrder.length > 0) {
        const lastJob = jobs.find(
          (j) => j.id === optimizedOrder[optimizedOrder.length - 1]
        );
        totalDistance += calculateDistance(
          lastJob.latitude,
          lastJob.longitude,
          end_location.latitude,
          end_location.longitude
        );
      }

      // Update route_order in database
      for (let i = 0; i < optimizedOrder.length; i++) {
        await pool.query("UPDATE jobs SET route_order = $1 WHERE id = $2", [
          i + 1,
          optimizedOrder[i],
        ]);
      }

      res.json({
        optimized_order: optimizedOrder,
        total_jobs: optimizedOrder.length,
        total_distance_km: Math.round(totalDistance * 100) / 100,
        start_location: start_location,
        end_location: end_location,
      });
    } catch (error) {
      console.error("Route optimization error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Helper function for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Advanced Route Optimization endpoint with 2-opt improvement
app.post(
  "/api/jobs/optimize-route-advanced",
  authenticateToken,
  requirePermission("jobs.assign"),
  async (req, res) => {
    try {
      const {
        job_ids,
        start_location,
        optimization_type = "distance",
        consider_traffic = true,
        time_windows = false,
      } = req.body;

      if (!job_ids || job_ids.length === 0) {
        return res
          .status(400)
          .json({ error: "No jobs selected for optimization" });
      }

      // Get job locations with additional data
      const jobsResult = await pool.query(
        `SELECT j.id, j.scheduled_time, j.estimated_duration, c.latitude, c.longitude, c.address
       FROM jobs j
       JOIN customers c ON j.customer_id = c.id
       WHERE j.id = ANY($1::int[])
       AND c.latitude IS NOT NULL
       AND c.longitude IS NOT NULL
       ORDER BY j.scheduled_time`,
        [job_ids]
      );

      const jobs = jobsResult.rows;

      if (jobs.length < 2) {
        return res.json({ optimized_order: job_ids });
      }

      // Initial nearest neighbor solution
      let optimizedOrder = nearestNeighborOptimization(jobs, start_location);

      // Apply 2-opt improvement if we have enough jobs
      if (jobs.length > 3) {
        optimizedOrder = twoOptImprovement(
          jobs,
          optimizedOrder,
          start_location
        );
      }

      // Calculate total metrics
      const metrics = calculateRouteMetrics(
        jobs,
        optimizedOrder,
        start_location,
        consider_traffic
      );

      // Update route_order in database
      for (let i = 0; i < optimizedOrder.length; i++) {
        await pool.query("UPDATE jobs SET route_order = $1 WHERE id = $2", [
          i + 1,
          optimizedOrder[i],
        ]);
      }

      res.json({
        optimized_order: optimizedOrder,
        total_jobs: optimizedOrder.length,
        total_distance_km: metrics.distance,
        estimated_duration_hours: metrics.duration,
        optimization_type: optimization_type,
        improvements: metrics.improvements,
      });
    } catch (error) {
      console.error("Advanced route optimization error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Enhanced nearest neighbor with time windows
function nearestNeighborOptimization(jobs, startLocation) {
  const optimizedOrder = [];
  const unvisited = [...jobs];

  let currentLocation = startLocation || {
    latitude: jobs[0].latitude,
    longitude: jobs[0].longitude,
  };

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestScore = Infinity;

    unvisited.forEach((job, index) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        job.latitude,
        job.longitude
      );

      // Consider time windows if scheduled_time exists
      let timePenalty = 0;
      if (job.scheduled_time) {
        const jobTime = new Date(job.scheduled_time);
        const currentTime = new Date();
        const timeDiff = Math.abs(jobTime - currentTime) / (1000 * 60 * 60); // hours
        timePenalty = timeDiff * 0.1; // Small penalty for time deviation
      }

      const score = distance + timePenalty;

      if (score < nearestScore) {
        nearestScore = score;
        nearestIndex = index;
      }
    });

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    optimizedOrder.push(nearest.id);
    currentLocation = {
      latitude: nearest.latitude,
      longitude: nearest.longitude,
    };
  }

  return optimizedOrder;
}

// 2-opt improvement algorithm
function twoOptImprovement(jobs, route, startLocation) {
  let improved = true;
  let bestDistance = calculateTotalDistance(jobs, route, startLocation);
  let bestRoute = [...route];

  while (improved) {
    improved = false;

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        // Create new route by reversing segment i+1 to j
        const newRoute = [...route];
        const segment = newRoute.slice(i + 1, j + 1).reverse();
        newRoute.splice(i + 1, j - i, ...segment);

        const newDistance = calculateTotalDistance(
          jobs,
          newRoute,
          startLocation
        );

        if (newDistance < bestDistance) {
          bestDistance = newDistance;
          bestRoute = newRoute;
          improved = true;
        }
      }
    }

    if (improved) {
      route = [...bestRoute];
    }
  }

  return bestRoute;
}

// Calculate total distance for a route
function calculateTotalDistance(jobs, route, startLocation) {
  let totalDistance = 0;
  let currentLocation = startLocation;

  for (let i = 0; i < route.length; i++) {
    const job = jobs.find((j) => j.id === route[i]);
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      job.latitude,
      job.longitude
    );
    totalDistance += distance;
    currentLocation = { latitude: job.latitude, longitude: job.longitude };
  }

  return totalDistance;
}

// Calculate comprehensive route metrics
function calculateRouteMetrics(jobs, route, startLocation, considerTraffic) {
  let totalDistance = 0;
  let totalDuration = 0;
  let currentLocation = startLocation;

  for (let i = 0; i < route.length; i++) {
    const job = jobs.find((j) => j.id === route[i]);
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      job.latitude,
      job.longitude
    );

    totalDistance += distance;

    // Estimate travel time (assuming 50 km/h average speed)
    const travelTime = distance / 50; // hours
    totalDuration += travelTime;

    // Add job duration if available
    if (job.estimated_duration) {
      totalDuration += job.estimated_duration / 60; // convert minutes to hours
    }

    currentLocation = { latitude: job.latitude, longitude: job.longitude };
  }

  // Apply traffic factor if requested
  if (considerTraffic) {
    totalDuration *= 1.2; // 20% traffic penalty
  }

  return {
    distance: Math.round(totalDistance * 100) / 100,
    duration: Math.round(totalDuration * 100) / 100,
    improvements: route.length > 3 ? "2-opt applied" : "nearest neighbor only",
  };
}

// Dashboard stats
app.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    const customerCount = await pool.query(
      "SELECT COUNT(*) as total FROM customers"
    );
    const jobCount = await pool.query("SELECT COUNT(*) as total FROM jobs");
    const pendingCount = await pool.query(
      "SELECT COUNT(*) as total FROM jobs WHERE status = $1",
      ["pending"]
    );

    res.json({
      stats: {
        totalCustomers: parseInt(customerCount.rows[0].total),
        totalJobs: parseInt(jobCount.rows[0].total),
        pendingJobs: parseInt(pendingCount.rows[0].total),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Enhanced geocoding endpoint with validation
app.post("/api/geocode", authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const { geocodeAddress, validateAddress } = require("./services/geocoding");

    // First validate the address
    const validation = await validateAddress(address);

    // Then geocode it
    const result = await geocodeAddress(address);

    if (result) {
      res.json({
        latitude: result.latitude,
        longitude: result.longitude,
        formatted_address: result.formatted_address,
        location_type: result.location_type,
        confidence_score: result.confidence_score,
        verified: result.verified,
        validation: validation,
      });
    } else {
      res.status(404).json({ error: "Address not found" });
    }
  } catch (error) {
    console.error("Geocoding endpoint error:", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

// Address validation endpoint
app.post("/api/validate-address", authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const { validateAddress } = require("./services/geocoding");
    const validation = await validateAddress(address);

    res.json(validation);
  } catch (error) {
    console.error("Address validation error:", error);
    res.status(500).json({ error: "Address validation failed" });
  }
});

// Add known address endpoint
app.post(
  "/api/known-addresses",
  authenticateToken,
  requirePermission("admin"),
  async (req, res) => {
    try {
      const { address, latitude, longitude, name } = req.body;

      if (!address || !latitude || !longitude) {
        return res
          .status(400)
          .json({ error: "Address, latitude, and longitude are required" });
      }

      const {
        addKnownAddress,
        KNOWN_ADDRESSES,
      } = require("./services/geocoding");
      addKnownAddress(address, latitude, longitude, name);

      res.json({
        message: "Known address added successfully",
        known_addresses: Object.keys(KNOWN_ADDRESSES),
      });
    } catch (error) {
      console.error("Add known address error:", error);
      res.status(500).json({ error: "Failed to add known address" });
    }
  }
);

// Get known addresses endpoint
app.get("/api/known-addresses", authenticateToken, async (req, res) => {
  try {
    const { KNOWN_ADDRESSES } = require("./services/geocoding");

    const addresses = Object.entries(KNOWN_ADDRESSES).map(
      ([address, data]) => ({
        address,
        latitude: data.latitude,
        longitude: data.longitude,
        name: data.name,
        verified: data.verified,
      })
    );

    res.json({ known_addresses: addresses });
  } catch (error) {
    console.error("Get known addresses error:", error);
    res.status(500).json({ error: "Failed to get known addresses" });
  }
});

// Secure Maps Configuration endpoint
app.get("/api/maps-config", authenticateToken, (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Maps API key not configured" });
    }

    res.json({
      apiKey: apiKey,
      restrictions: {
        domain: process.env.DOMAIN || req.get("origin"),
        apis: ["maps", "geocoding", "directions"],
        referrer: process.env.DOMAIN || req.get("origin"),
      },
      mapOptions: {
        gestureHandling: "greedy",
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      },
    });
  } catch (error) {
    console.error("Maps config error:", error);
    res.status(500).json({ error: "Failed to load maps configuration" });
  }
});

// Debug endpoint to show all jobs (for troubleshooting)
app.get("/api/jobs/debug", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        j.*,
        c.name as customer_name,
        c.address as customer_address,
        c.latitude,
        c.longitude,
        u.name as technician_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN users u ON j.assigned_to = u.id
      ORDER BY j.id DESC
    `;

    const result = await pool.query(query);
    res.json({
      jobs: result.rows,
      total_jobs: result.rows.length,
      jobs_with_coordinates: result.rows.filter(
        (job) => job.latitude && job.longitude
      ).length,
      jobs_pending_inprogress: result.rows.filter((job) =>
        ["pending", "in_progress"].includes(job.status)
      ).length,
    });
  } catch (error) {
    console.error("Debug jobs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== REAL-TIME FEATURES =====

// Real-time technician location tracking
app.post(
  "/api/technicians/:id/location",
  authenticateToken,
  async (req, res) => {
    try {
      const { latitude, longitude, accuracy, timestamp } = req.body;

      await pool.query(
        `
      INSERT INTO technician_locations (user_id, latitude, longitude, accuracy, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET latitude = $2, longitude = $3, accuracy = $4, updated_at = $5
    `,
        [req.params.id, latitude, longitude, accuracy, new Date(timestamp)]
      );

      // Emit to connected clients via WebSocket
      io.to(`technician_${req.params.id}`).emit("location_update", {
        technicianId: req.params.id,
        location: { latitude, longitude, accuracy, timestamp },
      });

      res.json({ success: true, message: "Location updated successfully" });
    } catch (error) {
      console.error("Location update error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  }
);

// Get technician locations
app.get("/api/technicians/locations", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        tl.user_id,
        tl.latitude,
        tl.longitude,
        tl.accuracy,
        tl.updated_at,
        u.name as technician_name,
        u.role
      FROM technician_locations tl
      JOIN users u ON tl.user_id = u.id
      WHERE u.role = 'technician'
      AND tl.updated_at > NOW() - INTERVAL '1 hour'
      ORDER BY tl.updated_at DESC
    `);

    res.json({ locations: result.rows });
  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ error: "Failed to get technician locations" });
  }
});

// Route sharing functionality
app.post("/api/routes/share", authenticateToken, async (req, res) => {
  try {
    const { routeId, routeData } = req.body;
    const shareToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO shared_routes (route_id, share_token, created_by, expires_at) VALUES ($1, $2, $3, $4)",
      [
        routeId,
        shareToken,
        req.user.id,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      ] // 24 hours
    );

    res.json({
      shareUrl: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/shared-route/${shareToken}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      shareToken,
    });
  } catch (error) {
    console.error("Route sharing error:", error);
    res.status(500).json({ error: "Failed to create shared route" });
  }
});

// Get shared route
app.get("/api/routes/shared/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      "SELECT * FROM shared_routes WHERE share_token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Shared route not found or expired" });
    }

    const sharedRoute = result.rows[0];

    // Get route data (you might want to store route data in a separate table)
    // For now, we'll return the basic info
    res.json({
      routeId: sharedRoute.route_id,
      createdAt: sharedRoute.created_at,
      expiresAt: sharedRoute.expires_at,
    });
  } catch (error) {
    console.error("Get shared route error:", error);
    res.status(500).json({ error: "Failed to get shared route" });
  }
});

// ETA calculation with traffic
app.post("/api/eta/calculate", authenticateToken, async (req, res) => {
  try {
    const { fromLocation, toLocation, considerTraffic = true } = req.body;

    if (!fromLocation || !toLocation) {
      return res
        .status(400)
        .json({ error: "From and to locations are required" });
    }

    // Use Google Maps Directions API for traffic-aware ETA
    const { Client } = require("@googlemaps/google-maps-services-js");
    const client = new Client({});

    const response = await client.directions({
      params: {
        origin: `${fromLocation.latitude},${fromLocation.longitude}`,
        destination: `${toLocation.latitude},${toLocation.longitude}`,
        mode: "driving",
        departure_time: "now",
        traffic_model: considerTraffic ? "best_guess" : "pessimistic",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === "OK") {
      const route = response.data.routes[0];
      const leg = route.legs[0];

      const eta = {
        duration: leg.duration.value,
        durationInTraffic: leg.duration_in_traffic?.value || leg.duration.value,
        distance: leg.distance.value,
        eta: new Date(
          Date.now() +
            (leg.duration_in_traffic?.value || leg.duration.value) * 1000
        ),
        trafficLevel: leg.duration_in_traffic
          ? "traffic_considered"
          : "no_traffic_data",
        steps: leg.steps.map((step) => ({
          instruction: step.html_instructions,
          distance: step.distance.value,
          duration: step.duration.value,
        })),
      };

      res.json(eta);
    } else {
      res
        .status(400)
        .json({ error: `Directions request failed: ${response.data.status}` });
    }
  } catch (error) {
    console.error("ETA calculation error:", error);
    res.status(500).json({ error: "Failed to calculate ETA" });
  }
});

// Enhanced Authentication Routes

// Refresh token endpoint
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const { accessToken, user } = await authService.refreshAccessToken(
      refreshToken
    );

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Token refresh failed" });
  }
});

// Password reset request
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const { resetToken, user } = await authService.generatePasswordResetToken(
      email
    );
    await authService.sendPasswordResetEmail(email, resetToken);

    res.json({
      message: "Password reset email sent",
      email: user.email, // Return email for confirmation
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    // Don't reveal if user exists or not
    res.json({
      message: "If the email exists, a password reset link has been sent",
    });
  }
});

// Password reset
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, reset token, and new password required" });
    }

    await authService.resetPassword(email, resetToken, newPassword);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Email verification request
app.post("/api/auth/send-verification", authenticateToken, async (req, res) => {
  try {
    const verificationToken = await authService.generateEmailVerificationToken(
      req.user.id
    );
    await authService.sendEmailVerification(req.user.email, verificationToken);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Email verification request error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// Email verification
app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { userId, verificationToken } = req.body;

    if (!userId || !verificationToken) {
      return res
        .status(400)
        .json({ error: "User ID and verification token required" });
    }

    await authService.verifyEmail(userId, verificationToken);

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Logout (invalidate session)
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"];

    if (sessionId) {
      await authService.invalidateSession(sessionId);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Get user sessions
app.get("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    const sessions = await authService.getUserSessions(req.user.id);
    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

// Invalidate specific session
app.delete(
  "/api/auth/sessions/:sessionId",
  authenticateToken,
  async (req, res) => {
    try {
      await authService.invalidateSession(req.params.sessionId);
      res.json({ message: "Session invalidated" });
    } catch (error) {
      console.error("Session invalidation error:", error);
      res.status(500).json({ error: "Failed to invalidate session" });
    }
  }
);

// Invalidate all user sessions
app.delete("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    await authService.invalidateAllUserSessions(req.user.id);
    res.json({ message: "All sessions invalidated" });
  } catch (error) {
    console.error("Sessions invalidation error:", error);
    res.status(500).json({ error: "Failed to invalidate sessions" });
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
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io, socketService };
