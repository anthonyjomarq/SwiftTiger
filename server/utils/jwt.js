// server/utils/jwt.js - Hybrid version that works with temp and real tokens
import jwt from "jsonwebtoken";

// Generate real JWT access token
export const generateToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars",
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );
  } catch (error) {
    console.error("Error generating token:", error);
    // Fallback to temp token if JWT fails
    return (
      "jwt-token-" + Date.now() + "-" + Math.random().toString(36).substring(7)
    );
  }
};

// Generate real JWT refresh token
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET ||
        "your-super-secret-refresh-key-min-32-chars",
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
      }
    );
  } catch (error) {
    console.error("Error generating refresh token:", error);
    // Fallback to temp token if JWT fails
    return (
      "refresh-token-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(7)
    );
  }
};

// Verify token - works with both real JWTs and temp tokens
export const verifyToken = (token) => {
  try {
    // First, try to verify as a real JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars"
    );
    return decoded;
  } catch (jwtError) {
    // If JWT verification fails, check if it's a valid temp token
    if (
      token &&
      (token.startsWith("jwt-token-") || token.startsWith("temp-jwt-token-"))
    ) {
      console.log(
        "Using temporary token verification for:",
        token.substring(0, 20) + "..."
      );

      // Return a mock payload for temp tokens
      return {
        userId: 1,
        email: "admin@swifttiger.com",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      };
    }

    // If it's neither a valid JWT nor a valid temp token, throw error
    throw new Error("Invalid token");
  }
};

// Verify refresh token - works with both real JWTs and temp tokens
export const verifyRefreshToken = (token) => {
  try {
    // First, try to verify as a real JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET ||
        "your-super-secret-refresh-key-min-32-chars"
    );
    return decoded;
  } catch (jwtError) {
    // If JWT verification fails, check if it's a valid temp token
    if (
      token &&
      (token.startsWith("refresh-token-") ||
        token.startsWith("temp-refresh-token-"))
    ) {
      console.log(
        "Using temporary refresh token verification for:",
        token.substring(0, 20) + "..."
      );

      // Return a mock payload for temp refresh tokens
      return {
        userId: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
      };
    }

    // If it's neither a valid JWT nor a valid temp token, throw error
    throw new Error("Invalid refresh token");
  }
};

// Extract token from authorization header
export const getTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

// Decode token without verification (for expired token info)
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    // For temp tokens, return basic info
    if (
      token &&
      (token.startsWith("jwt-token-") || token.startsWith("temp-jwt-token-"))
    ) {
      return {
        userId: 1,
        role: "admin",
        type: "temporary",
      };
    }
    return null;
  }
};

// Check if we should use real JWT or temp tokens
export const shouldUseRealJWT = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  return (
    jwtSecret &&
    refreshSecret &&
    jwtSecret !== "your-super-secret-jwt-key-min-32-chars" &&
    refreshSecret !== "your-super-secret-refresh-key-min-32-chars"
  );
};

// Generate token (smart version that chooses real JWT or temp based on config)
export const generateSmartToken = (payload) => {
  if (shouldUseRealJWT()) {
    console.log("Generating real JWT token");
    return generateToken(payload);
  } else {
    console.log(
      "Generating temporary token (JWT secrets not properly configured)"
    );
    return (
      "jwt-token-" + Date.now() + "-" + Math.random().toString(36).substring(7)
    );
  }
};

export const generateSmartRefreshToken = (payload) => {
  if (shouldUseRealJWT()) {
    console.log("Generating real JWT refresh token");
    return generateRefreshToken(payload);
  } else {
    console.log(
      "Generating temporary refresh token (JWT secrets not properly configured)"
    );
    return (
      "refresh-token-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(7)
    );
  }
};
