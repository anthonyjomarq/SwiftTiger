// client/src/components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, requireAuth = true, roles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log("🔍 ProtectedRoute check:", {
    isAuthenticated,
    isLoading,
    user: user?.email,
    userRole: user?.role,
    requiredRoles: roles,
    requireAuth,
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#666",
        }}
      >
        Loading SwiftTiger...
      </div>
    );
  }

  // Handle routes that should NOT require authentication (like login page)
  if (!requireAuth) {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise, show the component (login page)
    return children;
  }

  // For protected routes, check if user is authenticated
  if (!isAuthenticated) {
    console.log("🚫 User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (roles.length > 0 && user) {
    const hasRequiredRole = roles.includes(user.role);

    console.log("🔍 Role check:", {
      userRole: user.role,
      requiredRoles: roles,
      hasAccess: hasRequiredRole,
    });

    if (!hasRequiredRole) {
      console.log(
        "🚫 User does not have required role, redirecting to unauthorized"
      );
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has required role, show the component
  console.log("✅ Access granted");
  return children;
};

export default ProtectedRoute;
