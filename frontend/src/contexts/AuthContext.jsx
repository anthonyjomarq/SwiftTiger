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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

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

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
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
