import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/shared/contexts/AuthContext';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { DemoModeProvider } from '@/demo/contexts/DemoModeContext';
import { ProtectedRoute } from '@/app/components/layout/ProtectedRoute';
import { Layout } from '@/app/components/layout/Layout';
import { Login } from '@/app/pages/Login';
import { Dashboard } from '@/app/pages/Dashboard';
import { Customers } from '@/app/pages/Customers';
import { Jobs } from '@/app/pages/Jobs';
import { JobLogs } from '@/app/pages/JobLogs';
import { Users } from '@/app/pages/Users';
import { Routes as RoutesPage } from '@/app/pages/Routes';
import { Audit } from '@/app/pages/Audit';

export function App() {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Jobs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <JobLogs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routes"
              element={
                <ProtectedRoute requiredRoles={['admin', 'manager', 'dispatcher']}>
                  <Layout>
                    <RoutesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute requiredRoles={['admin', 'manager']}>
                  <Layout>
                    <Audit />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </DemoModeProvider>
    </ThemeProvider>
  );
}
