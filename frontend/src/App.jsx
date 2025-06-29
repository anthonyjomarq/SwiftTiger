import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Jobs from "./pages/Jobs";
import RoutePlanning from "./pages/RoutePlanning";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/routes" element={<RoutePlanning />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
