import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUser, isAuthenticated, clearAuth } from '../utils/auth.ts';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      if (isAuthenticated()) {
        setUser(getUser());
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    
    if (typeof requiredRoles === 'string') {
      return user.role === requiredRoles;
    }
    
    return requiredRoles.includes(user.role);
  };

  const isMainAdmin = () => {
    return user?.isMainAdmin === true;
  };

  const value = {
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