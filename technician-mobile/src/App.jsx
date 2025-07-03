import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Shared components
import { ResponsiveProvider } from '../shared/components/ResponsiveProvider';
import { NotificationHub } from '../shared/components/NotificationHub';
import { MobileAppShell, MobileBottomNav } from '../shared/components/MobileLayout';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { LocationProvider } from './contexts/LocationContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import TimesheetPage from './pages/TimesheetPage';
import ProfilePage from './pages/ProfilePage';
import CameraPage from './pages/CameraPage';
import SignaturePage from './pages/SignaturePage';
import EmergencyPage from './pages/EmergencyPage';
import OfflinePage from './pages/OfflinePage';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LocationTracker } from './components/LocationTracker';

function App({ onReady }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // App is ready
    if (onReady) {
      onReady();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReady]);

  // Bottom navigation configuration
  const getBottomNavItems = () => [
    {
      id: 'dashboard',
      label: 'Home',
      icon: '🏠',
      path: '/dashboard'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: '📋',
      path: '/jobs',
      badge: 3 // Example: 3 pending jobs
    },
    {
      id: 'timesheet',
      label: 'Time',
      icon: '⏰',
      path: '/timesheet'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile'
    }
  ];

  const handleBottomNavChange = (item) => {
    navigate(item.path);
  };

  const getCurrentNavItem = () => {
    const currentPath = location.pathname;
    const items = getBottomNavItems();
    return items.find(item => currentPath.startsWith(item.path))?.id || 'dashboard';
  };

  // Don't show bottom nav on certain pages
  const hideBottomNavPages = ['/login', '/camera', '/signature', '/emergency'];
  const shouldShowBottomNav = !hideBottomNavPages.some(page => 
    location.pathname.startsWith(page)
  );

  return (
    <ResponsiveProvider>
      <AuthProvider>
        <OfflineProvider>
          <LocationProvider>
            <div className="app">
              <NotificationHub />
              <OfflineIndicator isOnline={isOnline} />
              <LocationTracker />

              <MobileAppShell
                showBottomNav={shouldShowBottomNav}
                bottomNav={
                  shouldShowBottomNav && (
                    <MobileBottomNav
                      items={getBottomNavItems()}
                      activeItem={getCurrentNavItem()}
                      onItemChange={handleBottomNavChange}
                      variant="elevated"
                    />
                  )
                }
              >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/offline" element={<OfflinePage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/jobs"
                    element={
                      <ProtectedRoute>
                        <JobsPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/jobs/:id"
                    element={
                      <ProtectedRoute>
                        <JobDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/timesheet"
                    element={
                      <ProtectedRoute>
                        <TimesheetPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/camera"
                    element={
                      <ProtectedRoute>
                        <CameraPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/signature"
                    element={
                      <ProtectedRoute>
                        <SignaturePage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/emergency"
                    element={
                      <ProtectedRoute>
                        <EmergencyPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </MobileAppShell>
            </div>
          </LocationProvider>
        </OfflineProvider>
      </AuthProvider>
    </ResponsiveProvider>
  );
}

export default App;