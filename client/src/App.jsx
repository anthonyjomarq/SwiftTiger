import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import Layout from "./components/common/Layout";

// Dashboard Components
import AdminDashboard from "./components/dashboard/AdminDashboard";
import DispatcherDashboard from "./components/dashboard/DispatcherDashboard";
import TechnicianDashboard from "./components/dashboard/TechnicianDashboard";

// Admin Components
import UserManagement from "./components/admin/UserManagement";
import ActivityLogs from "./components/admin/ActivityLogs";

// Profile Component
import UserProfile from "./components/profile/UserProfile";

// CSS
import "./index.css";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error Pages
const NotFoundPage = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      textAlign: "center",
      gap: "1rem",
    }}
  >
    <h1 style={{ fontSize: "3rem", margin: 0 }}>404</h1>
    <h2 style={{ margin: 0 }}>Page Not Found</h2>
    <p style={{ color: "#666", margin: 0 }}>
      The page you're looking for doesn't exist.
    </p>
    <a
      href="/"
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#007bff",
        color: "white",
        textDecoration: "none",
        borderRadius: "4px",
        display: "inline-block",
      }}
    >
      Go Home
    </a>
  </div>
);

const UnauthorizedPage = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      textAlign: "center",
      gap: "1rem",
    }}
  >
    <h1 style={{ fontSize: "3rem", margin: 0 }}>403</h1>
    <h2 style={{ margin: 0 }}>Access Forbidden</h2>
    <p style={{ color: "#666", margin: 0 }}>
      You don't have permission to access this resource.
    </p>
    <a
      href="/"
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#007bff",
        color: "white",
        textDecoration: "none",
        borderRadius: "4px",
        display: "inline-block",
      }}
    >
      Go Home
    </a>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <RegisterForm />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Default dashboard redirect */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* General dashboard route that redirects based on role */}
                <Route path="dashboard" element={<DashboardRouter />} />

                {/* Role-specific dashboard routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="dispatcher/dashboard"
                  element={
                    <ProtectedRoute roles={["admin", "dispatcher"]}>
                      <DispatcherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="technician/dashboard"
                  element={
                    <ProtectedRoute
                      roles={["admin", "dispatcher", "technician"]}
                    >
                      <TechnicianDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <ActivityLogs />
                    </ProtectedRoute>
                  }
                />

                {/* User Profile Route - Available to all authenticated users */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Future routes for other features */}
                <Route
                  path="jobs/*"
                  element={
                    <div style={{ padding: "2rem" }}>
                      Job Management (Coming Soon)
                    </div>
                  }
                />
                <Route
                  path="customers/*"
                  element={
                    <div style={{ padding: "2rem" }}>
                      Customer Management (Coming Soon)
                    </div>
                  }
                />
                <Route
                  path="routes/*"
                  element={
                    <div style={{ padding: "2rem" }}>
                      Route Planning (Coming Soon)
                    </div>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <div style={{ padding: "2rem" }}>
                      System Settings (Coming Soon)
                    </div>
                  }
                />
              </Route>

              {/* Error pages */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              reverseOrder={false}
              gutter={8}
              containerClassName=""
              containerStyle={{}}
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#4ade80",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Dashboard router component to redirect based on user role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "dispatcher":
      return <Navigate to="/dispatcher/dashboard" replace />;
    case "technician":
      return <Navigate to="/technician/dashboard" replace />;
    default:
      return <Navigate to="/technician/dashboard" replace />;
  }
};

export default App;
