import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role (admin or manager for admin dashboard)
  const allowedRoles = ['admin', 'manager'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Current role: <span className="font-medium capitalize">{user.role}</span>
              </p>
              <p className="text-sm text-gray-500">
                Required role: Admin or Manager
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check specific role requirement if provided
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Privileges</h2>
            <p className="text-gray-600 mb-6">
              This section requires {requiredRole} access level.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Your role: <span className="font-medium capitalize">{user.role}</span>
              </p>
              <p className="text-sm text-gray-500">
                Required role: <span className="font-medium capitalize">{requiredRole}</span>
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check specific permission requirement if provided
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Permission Required</h2>
            <p className="text-gray-600 mb-6">
              You don't have the necessary permission to access this feature.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Required permission: <span className="font-medium">{requiredPermission}</span>
              </p>
              <p className="text-sm text-gray-500">
                Contact your administrator to request access.
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;