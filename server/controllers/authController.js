import { User, ActionLog } from "../models/index.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Create new user
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    first_name: firstName, // Use database column name
    last_name: lastName, // Use database column name
    role: role || "technician",
    phone,
  });

  // Log action
  await ActionLog.logAction(
    user.id,
    "CREATE",
    "USER",
    user.id,
    {
      email: user.email,
      role: user.role,
    },
    req
  );

  // Generate tokens
  const token = generateToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: user.toSafeObject(),
      token,
      refreshToken,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Check if user is active
  if (!user.is_active) {
    // Use database column name
    return res.status(401).json({
      success: false,
      message: "Account is deactivated",
    });
  }

  // Validate password
  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Update last login
  await user.update({ last_login: new Date() }); // Use database column name

  // Log action
  await ActionLog.logAction(
    user.id,
    "LOGIN",
    "USER",
    user.id,
    {
      email: user.email,
      loginTime: new Date(),
    },
    req
  );

  // Generate tokens
  const token = generateToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: user.toSafeObject(),
      token,
      refreshToken,
    },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newToken = generateToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    // Log action
    await ActionLog.logAction(
      user.id,
      "REFRESH_TOKEN",
      "USER",
      user.id,
      null,
      req
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  // Log action
  await ActionLog.logAction(
    req.user.id,
    "LOGOUT",
    "USER",
    req.user.id,
    null,
    req
  );

  res.json({
    success: true,
    message: "Logout successful",
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate current password
  const isCurrentPasswordValid = await req.user.validatePassword(
    currentPassword
  );
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  // Update password
  await req.user.update({ password: newPassword });

  // Log action
  await ActionLog.logAction(
    req.user.id,
    "CHANGE_PASSWORD",
    "USER",
    req.user.id,
    null,
    req
  );

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

export { register, login, refreshToken, getProfile, logout, changePassword };
