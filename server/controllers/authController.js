import { User } from "../models/index.js";
import jwt from "jsonwebtoken";
import { logAction } from "../services/actionLogger.js";
import { logAction } from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret";

const generateTokens = (userId, role) => {
  const payload = { userId, role };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || "technician",
      phone,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Log registration
    req.user = user; // Add user to req for logging
    await logAction(req, "USER_REGISTERED", "USER", user.id, {
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token: accessToken,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("❌ User not found:", email);
      await logAction(req, "LOGIN_FAILED", "AUTH", null, { email });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isValidPassword = await user.comparePassword(password);
    console.log("🔑 Password valid:", isValidPassword);

    if (!isValidPassword) {
      await logAction(req, "LOGIN_FAILED", "AUTH", null, { email });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Log successful login
    req.user = user; // Add user to req for logging
    await logAction(req, "USER_LOGIN", "AUTH", user.id, {
      email: user.email,
    });

    console.log("✅ Login successful for:", email);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const tokens = generateTokens(user.id, user.role);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      await logAction(req, "PASSWORD_CHANGE_FAILED", "USER", user.id, {
        reason: "Invalid current password",
      });
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    await user.update({ password: newPassword });

    // Generate new tokens
    const tokens = generateTokens(user.id, user.role);

    // Log password change
    await logAction(req, "PASSWORD_CHANGED", "USER", user.id);

    res.json({
      success: true,
      message: "Password changed successfully",
      data: tokens,
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      bio,
      department,
      location,
      email, // Only allow email updates for now, may want to add verification later
    } = req.body;

    console.log("🔄 Updating profile for user:", userId);

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use",
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (bio !== undefined) updateData.bio = bio?.trim() || null;
    if (department !== undefined)
      updateData.department = department?.trim() || null;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (email && email !== user.email)
      updateData.email = email.trim().toLowerCase();

    // Update user
    await user.update(updateData);

    // Log the action
    await logAction(req, "UPDATE_PROFILE", "USER", userId, {
      updatedFields: Object.keys(updateData),
    });

    // Return updated user data (excluding password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const getExtendedProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("👤 Fetching extended profile for user:", userId);

    // If using the simple/mock user (not from database)
    if (req.user && !req.user.get) {
      return res.json({
        success: true,
        data: {
          user: {
            ...req.user,
            bio: null,
            department: null,
            location: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          },
        },
      });
    }

    // For real users from database
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Log the action
    await logAction(req, "VIEW_PROFILE", "USER", userId);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get extended profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};
