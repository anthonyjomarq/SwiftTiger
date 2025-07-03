import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

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
  const [token, setToken] = useState(localStorage.getItem('tech_token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('tech_token');
      const savedUser = localStorage.getItem('tech_user');
      
      if (savedToken && savedUser) {
        try {
          // Verify token is still valid
          const response = await authApi.getCurrentUser(savedToken);
          if (response.success) {
            setToken(savedToken);
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('tech_token');
            localStorage.removeItem('tech_user');
            navigate('/login');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('tech_token');
          localStorage.removeItem('tech_user');
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
      const response = await authApi.login(email, password);
      
      if (response.success) {
        const { token: authToken, user: userData } = response.data;
        
        // Verify user is a technician
        if (userData.role !== 'technician') {
          throw new Error('Access denied. This app is for technicians only.');
        }
        
        // Store authentication data
        localStorage.setItem('tech_token', authToken);
        localStorage.setItem('tech_user', JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        navigate('/dashboard');
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
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
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    }
    
    // Clear local storage
    localStorage.removeItem('tech_token');
    localStorage.removeItem('tech_user');
    
    // Reset state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Navigate to login
    navigate('/login');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('tech_user', JSON.stringify(userData));
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
      // Handle network errors in offline mode
      if (!navigator.onLine) {
        throw new Error('No internet connection. Some features may be limited.');
      }
      throw error;
    }
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};