// server/routes/users.js - Simple working version
import express from "express";

const router = express.Router();

// Simple auth middleware - matches the one in auth.js
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log(
    "🔍 Auth header received:",
    authHeader ? authHeader.substring(0, 30) + "..." : "None"
  );

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.substring(7);
  console.log("🔍 Token extracted:", token.substring(0, 30) + "...");

  // Simple token validation - check if it's our format
  if (token && token.startsWith("simple-jwt-")) {
    console.log("✅ Token validated successfully");

    // Add user to request
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
    console.log("❌ Invalid token format:", token.substring(0, 20));
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
    });
  }
};

// Admin check middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
  next();
};

// Apply authentication to all routes
router.use(authenticate);

// Get all users (admin only)
router.get("/", requireAdmin, (req, res) => {
  try {
    console.log("✅ Get all users request by:", req.user.email);

    const {
      page = 1,
      limit = 10,
      role,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    // Mock users data
    let mockUsers = [
      {
        id: 1,
        email: "admin@swifttiger.com",
        role: "admin",
        firstName: "Admin",
        lastName: "User",
        isActive: true,
        createdAt: "2025-06-17T00:00:00.000Z",
        phone: "+1234567890",
      },
      {
        id: 2,
        email: "dispatcher@swifttiger.com",
        role: "dispatcher",
        firstName: "Dispatch",
        lastName: "Manager",
        isActive: true,
        createdAt: "2025-06-17T01:00:00.000Z",
        phone: "+1234567891",
      },
      {
        id: 3,
        email: "tech1@swifttiger.com",
        role: "technician",
        firstName: "John",
        lastName: "Technician",
        isActive: true,
        createdAt: "2025-06-17T02:00:00.000Z",
        phone: "+1234567892",
      },
      {
        id: 4,
        email: "tech2@swifttiger.com",
        role: "technician",
        firstName: "Jane",
        lastName: "Engineer",
        isActive: false,
        createdAt: "2025-06-17T03:00:00.000Z",
        phone: "+1234567893",
      },
    ];

    // Apply filters
    if (role) {
      mockUsers = mockUsers.filter((user) => user.role === role);
    }

    if (isActive !== undefined) {
      const activeFilter = isActive === "true";
      mockUsers = mockUsers.filter((user) => user.isActive === activeFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      mockUsers = mockUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = mockUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(mockUsers.length / parseInt(limit)),
          totalUsers: mockUsers.length,
          hasNextPage: endIndex < mockUsers.length,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get user by ID
router.get("/:id", (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log("✅ Get user by ID:", userId, "requested by:", req.user.email);

    // Mock user data
    const mockUser = {
      id: userId,
      email:
        userId === 1 ? "admin@swifttiger.com" : `user${userId}@swifttiger.com`,
      role: userId === 1 ? "admin" : userId === 2 ? "dispatcher" : "technician",
      firstName: userId === 1 ? "Admin" : `User`,
      lastName: userId === 1 ? "User" : `${userId}`,
      isActive: true,
      createdAt: "2025-06-17T00:00:00.000Z",
      phone: `+123456789${userId}`,
      lastLoginAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: { user: mockUser },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user
router.patch("/:id", (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;

    console.log(
      "✅ Update user:",
      userId,
      "by:",
      req.user.email,
      "updates:",
      updates
    );

    // Check permissions
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

    // Mock updated user
    const updatedUser = {
      id: userId,
      email: updates.email || `user${userId}@swifttiger.com`,
      role: updates.role || "technician",
      firstName: updates.firstName || "Updated",
      lastName: updates.lastName || "User",
      isActive: updates.isActive !== undefined ? updates.isActive : true,
      phone: updates.phone || `+123456789${userId}`,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete/deactivate user (admin only)
router.delete("/:id", requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    console.log("✅ Deactivate user:", userId, "by:", req.user.email);

    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    res.json({
      success: true,
      message: `User ${userId} deactivated successfully`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Activate user (admin only)
router.patch("/:id/activate", requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    console.log("✅ Activate user:", userId, "by:", req.user.email);

    res.json({
      success: true,
      message: `User ${userId} activated successfully`,
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get users by role
router.get("/role/:role", (req, res) => {
  try {
    const role = req.params.role;

    console.log("✅ Get users by role:", role, "requested by:", req.user.email);

    if (!["admin", "dispatcher", "technician"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Mock users by role
    const mockUsersByRole = [
      {
        id: 1,
        email: `${role}1@swifttiger.com`,
        role: role,
        firstName: role.charAt(0).toUpperCase() + role.slice(1),
        lastName: "User 1",
        isActive: true,
        createdAt: "2025-06-17T00:00:00.000Z",
      },
      {
        id: 2,
        email: `${role}2@swifttiger.com`,
        role: role,
        firstName: role.charAt(0).toUpperCase() + role.slice(1),
        lastName: "User 2",
        isActive: true,
        createdAt: "2025-06-17T01:00:00.000Z",
      },
    ];

    res.json({
      success: true,
      data: {
        users: mockUsersByRole,
        role: role,
        count: mockUsersByRole.length,
      },
    });
  } catch (error) {
    console.error("Get users by role error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get user stats (admin only)
router.get("/stats", requireAdmin, (req, res) => {
  try {
    console.log("✅ Get user stats requested by:", req.user.email);

    const stats = {
      totalUsers: 10,
      activeUsers: 8,
      inactiveUsers: 2,
      roleStats: [
        { role: "admin", count: 1 },
        { role: "dispatcher", count: 3 },
        { role: "technician", count: 6 },
      ],
      newUsersThisMonth: 2,
      lastActivity: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
