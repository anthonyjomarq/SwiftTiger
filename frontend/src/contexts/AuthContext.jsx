import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeoutId, setSessionTimeoutId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Session timeout management
  useEffect(() => {
    if (!user) return;

    const isRememberMe = localStorage.getItem("rememberMe") === "true";
    const SESSION_TIMEOUT = isRememberMe 
      ? 7 * 24 * 60 * 60 * 1000 // 7 days for remember me
      : 30 * 60 * 1000; // 30 minutes for regular session
    const WARNING_TIME = isRememberMe 
      ? 60 * 60 * 1000 // 1 hour warning for remember me
      : 5 * 60 * 1000; // 5 minutes for regular session

    const resetSessionTimeout = () => {
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
      }

      // Set timeout for session expiration
      const timeoutId = setTimeout(() => {
        // Show warning dialog 5 minutes before logout
        const shouldExtend = window.confirm(
          "Your session will expire in 5 minutes due to inactivity. Would you like to extend your session?"
        );

        if (shouldExtend) {
          setLastActivity(Date.now());
          // Reset the timeout
          resetSessionTimeout();
        } else {
          // Set final timeout for logout
          setTimeout(() => {
            logout();
            alert("You have been logged out due to inactivity.");
          }, WARNING_TIME);
        }
      }, SESSION_TIMEOUT - WARNING_TIME);

      setSessionTimeoutId(timeoutId);
    };

    // Initialize session timeout
    resetSessionTimeout();

    // Track user activity
    const updateActivity = () => {
      setLastActivity(Date.now());
      resetSessionTimeout();
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Cleanup
    return () => {
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user, sessionTimeoutId]);

  const checkAuth = async () => {
    try {
      const [userResponse, permissionsResponse] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/auth/permissions"),
      ]);

      setUser(userResponse.data.user);
      setPermissions(permissionsResponse.data.permissions);
    } catch (error) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token, user } = response.data;

      // Store token based on remember me preference
      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("rememberMe", "true");
        // Set longer session timeout for remember me
        localStorage.setItem("loginTime", Date.now().toString());
      } else {
        localStorage.setItem("token", token);
        localStorage.removeItem("rememberMe");
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);

      // Fetch permissions after login
      const permissionsResponse = await axios.get("/api/auth/permissions");
      setPermissions(permissionsResponse.data.permissions);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (name, email, password, role = "technician") => {
    try {
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);

      // Fetch permissions after registration
      const permissionsResponse = await axios.get("/api/auth/permissions");
      setPermissions(permissionsResponse.data.permissions);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permission) => {
    if (user?.role === "admin") return true;
    return permissions.some((p) => p.name === permission);
  };

  const hasAnyPermission = (...permissionList) => {
    if (user?.role === "admin") return true;
    return permissionList.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (...permissionList) => {
    if (user?.role === "admin") return true;
    return permissionList.every((permission) => hasPermission(permission));
  };

  const isAdmin = () => user?.role === "admin";
  const isDispatcher = () => user?.role === "dispatcher";
  const isTechnician = () => user?.role === "technician";

  const value = {
    user,
    permissions,
    login,
    register,
    logout,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isDispatcher,
    isTechnician,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
