/**
 * SwiftTiger Frontend Application
 * Main React application with routing, authentication, and real-time features
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */

// React and routing
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Contexts
import { useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Components
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// Utilities
import { ErrorBoundary as GlobalErrorBoundary } from "./utils/errorHandler";
import { toast } from "./utils/toast";

/**
 * Lazy-loaded page components for code splitting
 */
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobCreate = lazy(() => import("./pages/JobCreate"));
const RoutePlanning = lazy(() => import("./pages/RoutePlanning"));
const Layout = lazy(() => import("./components/Layout"));

/**
 * Main App component
 * Handles authentication state and routing
 *
 * @returns {JSX.Element} The main application component
 */
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <GlobalErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </GlobalErrorBoundary>
    );
  }

  return (
    <GlobalErrorBoundary>
      <ErrorBoundary>
        <SocketProvider>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/create" element={<JobCreate />} />
                <Route path="/routes" element={<RoutePlanning />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </Suspense>
          </Layout>
        </SocketProvider>
      </ErrorBoundary>
    </GlobalErrorBoundary>
  );
}

export default App;
