import express from "express";

const router = express.Router();

// Login endpoint
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check admin credentials
    if (email === "admin@swifttiger.com" && password === "admin123") {
      // Create simple tokens with NEW format
      const token = `simple-jwt-admin-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const refreshToken = `simple-refresh-admin-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;

      console.log(
        "✅ Login successful, NEW token:",
        token.substring(0, 30) + "..."
      );

      res.json({
        success: true,
        message: "Login successful",
        data: {
          token: token,
          refreshToken: refreshToken,
          user: {
            id: 1,
            email: "admin@swifttiger.com",
            role: "admin",
            firstName: "Admin",
            lastName: "User",
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
        },
      });
    } else {
      console.log("❌ Invalid credentials for:", email);
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Simple auth middleware for protected routes
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log(
    "🔍 Auth check, header:",
    authHeader ? authHeader.substring(0, 30) + "..." : "None"
  );

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.substring(7);
  console.log("🔍 Token check:", token.substring(0, 30) + "...");

  // Check for NEW token format
  if (token && token.startsWith("simple-jwt-")) {
    console.log("✅ Token validated!");
    req.user = {
      id: 1,
      email: "admin@swifttiger.com",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    };
    next();
  } else {
    console.log("❌ Invalid token format");
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
    });
  }
};

// Profile endpoint (protected)
router.get("/profile", authenticate, (req, res) => {
  console.log("✅ Profile request successful");
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// Register endpoint
router.post("/register", (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role = "technician",
  } = req.body;

  const token = `simple-jwt-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;
  const refreshToken = `simple-refresh-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      token: token,
      refreshToken: refreshToken,
      user: {
        id: Date.now(),
        email: email,
        role: role,
        firstName: firstName || "New",
        lastName: lastName || "User",
        isActive: true,
      },
    },
  });
});

// Other endpoints
router.post("/refresh", (req, res) => {
  const newToken = `simple-jwt-refreshed-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;
  const newRefreshToken = `simple-refresh-refreshed-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;

  res.json({
    success: true,
    data: { token: newToken, refreshToken: newRefreshToken },
  });
});

router.post("/logout", authenticate, (req, res) => {
  res.json({ success: true, message: "Logout successful" });
});

router.patch("/change-password", authenticate, (req, res) => {
  res.json({ success: true, message: "Password changed successfully" });
});

export default router;
