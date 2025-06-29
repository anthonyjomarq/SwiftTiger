const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { pool, initializeDatabase } = require("./database");
require("dotenv").config();

const app = express();
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

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT role FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization error" });
  }
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

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if this is the first user (make them admin)
    const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;
    const role = isFirstUser ? "admin" : "user";

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
      [email, hashedPassword, name, role]
    );

    const user = newUser.rows[0];
    const token = jwt.sign(
      { id: user.id, email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
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

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Customer routes
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM customers ORDER BY created_at DESC"
    );
    res.json({ customers: result.rows });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/customers", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const result = await pool.query(
      "INSERT INTO customers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, address]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only customer routes
app.put(
  "/api/customers/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, address } = req.body;

      const result = await pool.query(
        "UPDATE customers SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 RETURNING *",
        [name, email, phone, address, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/api/customers/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "DELETE FROM customers WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Job routes
app.get("/api/jobs", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*, c.name as customer_name 
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      ORDER BY j.created_at DESC
    `);
    res.json({ jobs: result.rows });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/jobs", authenticateToken, async (req, res) => {
  try {
    const { title, description, customer_id, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Job title is required" });
    }

    const result = await pool.query(
      "INSERT INTO jobs (title, description, customer_id, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, customer_id, status || "pending"]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, customer_id, status } = req.body;

    const result = await pool.query(
      "UPDATE jobs SET title = $1, description = $2, customer_id = $3, status = $4 WHERE id = $5 RETURNING *",
      [title, description, customer_id, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only job delete route
app.delete(
  "/api/jobs/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "DELETE FROM jobs WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
