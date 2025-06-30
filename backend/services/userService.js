const { pool } = require("../database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const socketService = require("./socketService");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

class UserService {
  constructor() {}

  /**
   * Get all users with proper permissions
   */
  async getUsers() {
    try {
      const result = await pool.query(
        "SELECT id, name, email, role FROM users ORDER BY name"
      );

      return {
        success: true,
        data: { users: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get users error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId) {
    try {
      const result = await pool.query(
        "SELECT id, email, name, role FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: { user: result.rows[0] },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get user by ID error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(userId) {
    try {
      const result = await pool.query(
        "SELECT id, email, name, role FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: { user: result.rows[0] },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId) {
    try {
      const result = await pool.query(
        `SELECT p.name, p.resource, p.action
         FROM users u
         JOIN role_permissions rp ON rp.role = u.role
         JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1`,
        [userId]
      );

      return {
        success: true,
        data: { permissions: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get permissions error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Create a new user with validation
   */
  async createUser(userData) {
    try {
      const { email, password, name, role = "technician" } = userData;

      // Validation
      if (!email || !password || !name) {
        return {
          success: false,
          error: "Email, password, and name are required",
          statusCode: 400,
        };
      }

      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return {
          success: false,
          error: "User already exists",
          statusCode: 400,
        };
      }

      // Check if this is the first user (make them admin)
      const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
      const isFirstUser = parseInt(userCount.rows[0].count) === 0;
      const finalRole = isFirstUser ? "admin" : role;

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await pool.query(
        "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
        [email, hashedPassword, name, finalRole]
      );

      const user = newUser.rows[0];

      // Emit WebSocket event for new user
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "user_created", user },
          null
        );
      }

      return {
        success: true,
        data: user,
        statusCode: 201,
      };
    } catch (error) {
      console.error("Create user error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Update an existing user with validation
   */
  async updateUser(userId, updateData) {
    try {
      const { email, name, role } = updateData;

      // Check if user exists
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
      );

      if (existingUser.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      // Check if email is being changed and if it already exists
      if (email && email !== existingUser.rows[0].email) {
        const emailCheck = await pool.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [email, userId]
        );

        if (emailCheck.rows.length > 0) {
          return {
            success: false,
            error: "Email already in use",
            statusCode: 400,
          };
        }
      }

      // Update user
      const result = await pool.query(
        "UPDATE users SET email = $1, name = $2, role = $3 WHERE id = $4 RETURNING id, email, name, role",
        [email, name, role, userId]
      );

      const updatedUser = result.rows[0];

      // Emit WebSocket event for user update
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "user_updated", user: updatedUser },
          null
        );
      }

      return {
        success: true,
        data: updatedUser,
        statusCode: 200,
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Delete a user with validation
   */
  async deleteUser(userId) {
    try {
      // Check if user has assigned jobs
      const jobsCheck = await pool.query(
        "SELECT COUNT(*) as job_count FROM jobs WHERE assigned_to = $1",
        [userId]
      );

      if (parseInt(jobsCheck.rows[0].job_count) > 0) {
        return {
          success: false,
          error: "Cannot delete user with assigned jobs",
          statusCode: 400,
        };
      }

      const result = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING id, email, name, role",
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      // Emit WebSocket event for user deletion
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "user_deleted", userId },
          null
        );
      }

      return {
        success: true,
        data: { message: "User deleted successfully" },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(email, password) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Invalid credentials",
          statusCode: 400,
        };
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return {
          success: false,
          error: "Invalid credentials",
          statusCode: 400,
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user
      const userResult = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404,
        };
      }

      const user = userResult.rows[0];

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return {
          success: false,
          error: "Current password is incorrect",
          statusCode: 400,
        };
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedNewPassword,
        userId,
      ]);

      return {
        success: true,
        data: { message: "Password changed successfully" },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    try {
      const result = await pool.query(
        "SELECT id, name, email, role FROM users WHERE role = $1 ORDER BY name",
        [role]
      );

      return {
        success: true,
        data: { users: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get users by role error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role FROM users 
         WHERE name ILIKE $1 OR email ILIKE $1 
         ORDER BY name`,
        [`%${searchTerm}%`]
      );

      return {
        success: true,
        data: { users: result.rows },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Search users error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const totalUsers = await pool.query(
        "SELECT COUNT(*) as total FROM users"
      );
      const usersByRole = await pool.query(
        "SELECT role, COUNT(*) as count FROM users GROUP BY role"
      );
      const activeTechnicians = await pool.query(
        "SELECT COUNT(*) as total FROM users WHERE role = 'technician'"
      );

      return {
        success: true,
        data: {
          totalUsers: parseInt(totalUsers.rows[0].total),
          usersByRole: usersByRole.rows,
          activeTechnicians: parseInt(activeTechnicians.rows[0].total),
        },
        statusCode: 200,
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      return {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      };
    }
  }
}

// Create singleton instance
const userService = new UserService();
module.exports = userService;
