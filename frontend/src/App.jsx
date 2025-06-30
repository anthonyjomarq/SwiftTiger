import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import LoadingSpinner from "./components/LoadingSpinner";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobCreate = lazy(() => import("./pages/JobCreate"));
const RoutePlanning = lazy(() => import("./pages/RoutePlanning"));
const Layout = React.memo(require("./components/Layout").default);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <SocketProvider>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/create" element={<JobCreate />} />
            <Route path="/routes" element={<RoutePlanning />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </SocketProvider>
  );
}

export default App;
