import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ResponsiveProvider } from '../../shared/components/ResponsiveProvider';
import { NotificationProvider } from '../../shared/components/NotificationHub';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from '../../shared/components/Layout';
import CustomerHeader from './components/CustomerHeader';
import CustomerLogin from './pages/CustomerLogin';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerJobs from './pages/CustomerJobs';
import CustomerJobDetail from './pages/CustomerJobDetail';
import CustomerProfile from './pages/CustomerProfile';
import CustomerSupport from './pages/CustomerSupport';
import NewJobRequest from './pages/NewJobRequest';
import '../../shared/styles/tokens.css';
import '../../shared/styles/mobile.css';
import './styles/customer.css';

/**
 * Customer Portal Application
 * Simplified interface for customers using Universal Foundation
 */

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-st-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main App Component
const CustomerApp = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  
  return (
    <AppLayout
      variant="customer"
      header={<CustomerHeader />}
      className="min-h-screen"
    >
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/jobs" element={
          <ProtectedRoute>
            <CustomerJobs />
          </ProtectedRoute>
        } />
        
        <Route path="/jobs/:id" element={
          <ProtectedRoute>
            <CustomerJobDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/new-request" element={
          <ProtectedRoute>
            <NewJobRequest />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <CustomerProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/support" element={
          <ProtectedRoute>
            <CustomerSupport />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
};

// Root App with Providers
const App = () => {
  return (
    <ResponsiveProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router basename="/customer">
            <CustomerApp />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ResponsiveProvider>
  );
};

export default App;