const TOKEN_KEY = "swifttiger_token";
const REFRESH_TOKEN_KEY = "swifttiger_refresh_token";

export const tokenManager = {
  // Get access token
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  // Get refresh token
  getRefreshToken: () => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  },

  // Set both tokens
  setTokens: (token, refreshToken) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error("Error setting tokens:", error);
    }
  },

  // Remove both tokens
  removeTokens: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error removing tokens:", error);
    }
  },

  // Check if token exists
  hasToken: () => {
    return !!tokenManager.getToken();
  },

  // Decode JWT token (without verification)
  decodeToken: (token) => {
    try {
      if (!token) return null;

      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    try {
      const decoded = tokenManager.decodeToken(token);
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  },

  // Get user info from token
  getUserFromToken: (token) => {
    try {
      const decoded = tokenManager.decodeToken(token);
      return decoded
        ? {
            userId: decoded.userId,
            role: decoded.role,
            exp: decoded.exp,
            iat: decoded.iat,
          }
        : null;
    } catch (error) {
      console.error("Error getting user from token:", error);
      return null;
    }
  },
};
