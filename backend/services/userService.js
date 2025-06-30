const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const socketService = require("./socketService");
const userRepository = require("../repositories/userRepository");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  internalServerErrorResponse,
} = require("../utils/apiResponse");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

class UserService {
  constructor() {}

  /**
   * Get all users with proper permissions
   */
  async getUsers() {
    try {
      const result = await userRepository.findAll();

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { users: result.data },
        "Users retrieved successfully"
      );
    } catch (error) {
      console.error("Get users error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId) {
    try {
      const result = await userRepository.findById(userId);

      if (!result.success) {
        return notFoundResponse("User");
      }

      return successResponse(
        { user: result.data },
        "User retrieved successfully"
      );
    } catch (error) {
      console.error("Get user by ID error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(userId) {
    try {
      const result = await userRepository.findById(userId);

      if (!result.success) {
        return notFoundResponse("User");
      }

      return successResponse(
        { user: result.data },
        "Current user retrieved successfully"
      );
    } catch (error) {
      console.error("Get current user error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId) {
    try {
      const result = await userRepository.getPermissions(userId);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { permissions: result.data },
        "User permissions retrieved successfully"
      );
    } catch (error) {
      console.error("Get permissions error:", error);
      return internalServerErrorResponse();
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
        return errorResponse("Email, password, and name are required", 400);
      }

      // Create user using repository (includes duplicate check and first user logic)
      const result = await userRepository.create({
        email,
        password,
        name,
        role,
      });

      if (!result.success) {
        if (result.error === "User already exists") {
          return errorResponse("User already exists", 400);
        }
        return internalServerErrorResponse();
      }

      const user = result.data;

      // Emit WebSocket event for new user
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "user_created", user },
          null
        );
      }

      return successResponse(user, "User created successfully", 201);
    } catch (error) {
      console.error("Create user error:", error);
      return internalServerErrorResponse();
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

      // Update user using repository
      const result = await userRepository.update(userId, { email, name, role });

      if (!result.success) {
        return internalServerErrorResponse();
      }

      const updatedUser = result.data;

      // Emit WebSocket event for user update
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "user_updated", user: updatedUser },
          null
        );
      }

      return successResponse(updatedUser, "User updated successfully");
    } catch (error) {
      console.error("Update user error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Delete a user with validation
   */
  async deleteUser(userId) {
    try {
      // Delete user using repository (includes job check)
      const result = await userRepository.delete(userId);

      if (!result.success) {
        if (result.error === "Cannot delete user with assigned jobs") {
          return errorResponse("Cannot delete user with assigned jobs", 400);
        }
        return notFoundResponse("User");
      }

      // Emit WebSocket event for user deletion
      if (socketService.getHandlers()) {
        socketService.broadcastJobUpdate(
          null,
          { type: "user_deleted", userId },
          null
        );
      }

      return successResponse(
        { message: "User deleted successfully" },
        "User deleted successfully"
      );
    } catch (error) {
      console.error("Delete user error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(email, password) {
    try {
      const result = await userRepository.findByEmail(email);

      if (!result.success) {
        return errorResponse("Invalid credentials", 400);
      }

      const user = result.data;
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return errorResponse("Invalid credentials", 400);
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return successResponse(
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        "Authentication successful"
      );
    } catch (error) {
      console.error("Authentication error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Verify current password using repository
      const verifyResult = await userRepository.verifyPassword(
        userId,
        currentPassword
      );

      if (!verifyResult.success) {
        return notFoundResponse("User");
      }

      if (!verifyResult.data.isMatch) {
        return errorResponse("Current password is incorrect", 400);
      }

      // Hash new password and update using repository
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updateResult = await userRepository.updatePassword(
        userId,
        hashedNewPassword
      );

      if (!updateResult.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { message: "Password changed successfully" },
        "Password changed successfully"
      );
    } catch (error) {
      console.error("Change password error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    try {
      const result = await userRepository.findByRole(role);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { users: result.data },
        "Users by role retrieved successfully"
      );
    } catch (error) {
      console.error("Get users by role error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm) {
    try {
      const result = await userRepository.search(searchTerm);

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        { users: result.data },
        "Users search completed successfully"
      );
    } catch (error) {
      console.error("Search users error:", error);
      return internalServerErrorResponse();
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const result = await userRepository.getStats();

      if (!result.success) {
        return internalServerErrorResponse();
      }

      return successResponse(
        result.data,
        "User statistics retrieved successfully"
      );
    } catch (error) {
      console.error("Get user stats error:", error);
      return internalServerErrorResponse();
    }
  }
}

// Create singleton instance
const userService = new UserService();
module.exports = userService;
