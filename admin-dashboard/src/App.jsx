import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Shared components
import { ResponsiveProvider } from '../shared/components/ResponsiveProvider';
import { NotificationHub } from '../shared/components/NotificationHub';

// Local contexts
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';

// Layout components
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';

// Dashboard pages
import DashboardHome from './pages/DashboardHome';
import UserManagement from './pages/UserManagement';
import JobManagement from './pages/JobManagement';
import RouteManagement from './pages/RouteManagement';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SystemMonitoring from './pages/SystemMonitoring';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">SwiftTiger Admin</h2>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveProvider>
      <AuthProvider>
        <AdminProvider>
          <div className="app min-h-screen bg-gray-50">
            <NotificationHub />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Admin Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                {/* Dashboard Routes */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardHome />} />
                
                {/* Management Routes */}
                <Route path="users" element={<UserManagement />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="routes" element={<RouteManagement />} />
                
                {/* Analytics & Reports */}
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
                
                {/* System */}
                <Route path="settings" element={<Settings />} />
                <Route path="monitoring" element={<SystemMonitoring />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </AdminProvider>
      </AuthProvider>
    </ResponsiveProvider>
  );
}

export default App;