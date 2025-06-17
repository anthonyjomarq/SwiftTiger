import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/common/Layout";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import DispatcherDashboard from "./components/dashboard/DispatcherDashboard";
import TechnicianDashboard from "./components/dashboard/TechnicianDashboard";
import UnauthorizedPage from "./components/common/UnauthorizedPage";
import NotFoundPage from "./components/common/NotFoundPage";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
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

              {/* Protected routes with layout */}
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

                {/* Future routes for other features */}
                <Route
                  path="users/*"
                  element={<div>User Management (Coming Soon)</div>}
                />
                <Route
                  path="jobs/*"
                  element={<div>Job Management (Coming Soon)</div>}
                />
                <Route
                  path="customers/*"
                  element={<div>Customer Management (Coming Soon)</div>}
                />
                <Route
                  path="routes/*"
                  element={<div>Route Planning (Coming Soon)</div>}
                />
                <Route
                  path="profile"
                  element={<div>Profile Settings (Coming Soon)</div>}
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
