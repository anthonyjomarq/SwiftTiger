import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../../shared/types/index.js';

/**
 * Customer Authentication Context
 * Shared auth system that works with main backend
 */

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Verify this is a customer account
        if (userData.data.role === 'customer') {
          setUser(userData.data);
          setIsAuthenticated(true);
        } else {
          // Not a customer account, clear token
          localStorage.removeItem('customer_token');
        }
      } else {
        // Invalid token, clear it
        localStorage.removeItem('customer_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('customer_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          portal: 'customer', // Specify customer portal
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verify this is a customer account
        if (data.data.user.role === 'customer') {
          localStorage.setItem('customer_token', data.data.token);
          setUser(data.data.user);
          setIsAuthenticated(true);
          return { success: true };
        } else {
          setError('Access denied. Customer accounts only.');
          return { success: false, error: 'Access denied. Customer accounts only.' };
        }
      } else {
        setError(data.message || 'Login failed');
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (token) {
        // Call logout endpoint
        await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('customer_token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const register = async (customerData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customerData,
          role: 'customer',
          portal: 'customer',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('customer_token', data.data.token);
        setUser(data.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(data.message || 'Registration failed');
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('customer_token');
      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data);
        return { success: true };
      } else {
        setError(data.message || 'Update failed');
        return { success: false, error: data.message || 'Update failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, portal: 'customer' }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Request failed');
        return { success: false, error: data.message || 'Request failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password: newPassword,
          portal: 'customer'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Reset failed');
        return { success: false, error: data.message || 'Reset failed' };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // API helper for authenticated requests
  const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('customer_token');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      // Handle token expiration
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    updateProfile,
    forgotPassword,
    resetPassword,
    apiRequest,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;