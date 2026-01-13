import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUser, isAuthenticated, clearAuth } from '@/shared/utils/auth';
import { StoredUser, UserRole } from '@/types/auth';

// Define the shape of the AuthContext value
interface AuthContextValue {
  user: StoredUser | null;
  login: (userData: StoredUser) => void;
  logout: () => void;
  hasRole: (requiredRoles: UserRole | UserRole[]) => boolean;
  isMainAdmin: () => boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

// Define props for the AuthProvider component
interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = (): void => {
      if (isAuthenticated()) {
        setUser(getUser());
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData: StoredUser): void => {
    setUser(userData);
  };

  const logout = (): void => {
    clearAuth();
    setUser(null);
  };

  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    if (typeof requiredRoles === 'string') {
      return user.role === requiredRoles;
    }
    
    return requiredRoles.includes(user.role);
  };

  const isMainAdmin = (): boolean => {
    return user?.isMainAdmin === true;
  };

  const value: AuthContextValue = {
    user,
    login,
    logout,
    hasRole,
    isMainAdmin,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};