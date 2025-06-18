import User from "../models/User.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
import { logAction } from "../services/actionLogger.js";

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

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
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
    await logAction(req, "USER_LOGIN", "AUTH", user.id, {
      email: user.email,
    });

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

    const decoded = verifyRefreshToken(refreshToken);
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
