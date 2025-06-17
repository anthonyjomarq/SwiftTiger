import { verifyToken, getTokenFromHeader } from "../utils/jwt.js";
import { User } from "../models/index.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      // Use database column name
      return res.status(401).json({
        success: false,
        message: "User account is deactivated.",
      });
    }

    // Check if password was changed after token was issued
    if (user.isPasswordChangedAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password was changed. Please log in again.",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions.",
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = getTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.userId);

      if (user && user.isActive && !user.isPasswordChangedAfter(decoded.iat)) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export { authenticate, authorize, optionalAuth };
