import React, { useEffect } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useDemoMode } from '@/demo/contexts/DemoModeContext';
import { UserRole } from '@/shared/types/business';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, loading, login } = useAuth();
  const { enableDemoMode } = useDemoMode();

  // Auto-login as demo user for portfolio demo (no login page needed)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      enableDemoMode();
      login({
        id: 'demo-admin',
        email: 'admin@swifttiger.com',
        name: 'Demo Admin',
        role: 'admin' as const,
      });
    }
  }, [loading, isAuthenticated, enableDemoMode, login]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}