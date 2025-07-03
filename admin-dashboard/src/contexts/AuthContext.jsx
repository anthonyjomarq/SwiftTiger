import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('admin_token');
      const savedUser = localStorage.getItem('admin_user');
      
      if (savedToken && savedUser) {
        try {
          // Verify token is still valid
          const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = JSON.parse(savedUser);
            
            // Verify user has admin privileges
            if (userData.role === 'admin' || userData.role === 'manager') {
              setToken(savedToken);
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // User doesn't have admin privileges
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              navigate('/login');
            }
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            navigate('/login');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const { token: authToken, user: userData } = data.data;
        
        // Verify user has admin privileges
        if (userData.role !== 'admin' && userData.role !== 'manager') {
          throw new Error('Access denied. Admin privileges required.');
        }
        
        // Store authentication data
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        navigate('/dashboard');
        return { success: true };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if online
      if (navigator.onLine && token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    }
    
    // Clear local storage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Reset state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Navigate to login
    navigate('/login');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
  };

  // API request helper with auth token
  const apiRequest = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers,
    };
    
    try {
      const response = await fetch(`/api${endpoint}`, config);
      
      // Handle unauthorized responses
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      
      return response;
    } catch (error) {
      // Handle network errors
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your connection.');
      }
      throw error;
    }
  };

  // Permission checking helper
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Manager permissions
    if (user.role === 'manager') {
      const managerPermissions = [
        'users.view', 'users.create', 'users.edit',
        'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.assign',
        'routes.view', 'routes.manage',
        'reports.view', 'analytics.view',
        'settings.view'
      ];
      return managerPermissions.includes(permission);
    }
    
    return false;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    apiRequest,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};