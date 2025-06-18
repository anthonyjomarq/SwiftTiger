import React, { createContext, useContext, useReducer, useEffect } from "react";
import { tokenManager } from "../utils/tokenManager";

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Action types
const ActionTypes = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  REFRESH_TOKEN: "REFRESH_TOKEN",
  SET_LOADING: "SET_LOADING",
  CLEAR_ERROR: "CLEAR_ERROR",
  UPDATE_USER: "UPDATE_USER",
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case ActionTypes.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // API base URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthState = async () => {
      const token = tokenManager.getToken();
      const refreshToken = tokenManager.getRefreshToken();

      console.log("🔍 Checking auth state - token exists:", !!token);

      if (token) {
        try {
          // Verify token with backend
          const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          console.log("🔍 Profile check response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("✅ Profile check successful:", data);

            dispatch({
              type: ActionTypes.LOGIN_SUCCESS,
              payload: {
                user: data.data.user,
                token,
                refreshToken,
              },
            });
          } else {
            console.log("❌ Profile check failed, clearing tokens");
            // Token invalid, clear storage
            tokenManager.removeTokens();
            dispatch({ type: ActionTypes.SET_LOADING, payload: false });
          }
        } catch (error) {
          console.error("❌ Auth check error:", error);
          tokenManager.removeTokens();
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      } else {
        console.log("🔍 No token found, user not authenticated");
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    checkAuthState();
  }, [API_URL]);

  // Login function
  const login = async (email, password) => {
    console.log("🔐 Attempting login for:", email);
    dispatch({ type: ActionTypes.LOGIN_START });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("🔍 Login response status:", response.status);

      const data = await response.json();
      console.log("🔍 Login response data:", data);

      if (response.ok && data.success) {
        // Handle response format
        let token, refreshToken, user;

        if (data.data) {
          token = data.data.token;
          refreshToken = data.data.refreshToken;
          user = data.data.user;
        } else {
          token = data.token;
          refreshToken = data.refreshToken;
          user = data.user;
        }

        console.log("✅ Login successful, storing tokens");
        console.log("🎫 Token:", token?.substring(0, 30) + "...");

        // Store tokens using tokenManager
        tokenManager.setTokens(token, refreshToken);

        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: { token, refreshToken, user },
        });

        return { success: true, data: { token, refreshToken, user } };
      } else {
        console.log("❌ Login failed:", data.message);
        dispatch({
          type: ActionTypes.LOGIN_FAILURE,
          payload: data.message || "Login failed",
        });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("❌ Login network error:", error);
      const errorMessage = "Network error. Please check your connection.";
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    console.log("📝 Attempting registration for:", userData.email);
    dispatch({ type: ActionTypes.LOGIN_START });

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log("🔍 Registration response:", data);

      if (response.ok && data.success) {
        // Handle response format
        let token, refreshToken, user;

        if (data.data) {
          token = data.data.token;
          refreshToken = data.data.refreshToken;
          user = data.data.user;
        } else {
          token = data.token;
          refreshToken = data.refreshToken;
          user = data.user;
        }

        // Auto-login after successful registration
        tokenManager.setTokens(token, refreshToken);

        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: { token, refreshToken, user },
        });

        return { success: true, data: { token, refreshToken, user } };
      } else {
        dispatch({
          type: ActionTypes.LOGIN_FAILURE,
          payload: data.message || "Registration failed",
        });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      const errorMessage = "Network error. Please check your connection.";
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    console.log("👋 Logging out user");
    try {
      // Call logout endpoint if token exists
      const token = tokenManager.getToken();
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear tokens
      tokenManager.removeTokens();

      // Reset state
      dispatch({ type: ActionTypes.LOGOUT });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // API request with auth
  const authenticatedRequest = async (url, options = {}) => {
    const token = tokenManager.getToken();

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(`${API_URL}${url}`, config);
      return response;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  // Helper function to check user roles
  const hasRole = (requiredRoles) => {
    if (!state.user || !state.isAuthenticated) {
      return false;
    }

    // If requiredRoles is a string, convert to array
    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    // Check if user's role is in the required roles
    return roles.includes(state.user.role);
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    authenticatedRequest,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
