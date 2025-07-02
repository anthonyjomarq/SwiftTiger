import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input, FormGroup } from '../../../shared/components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';

/**
 * Customer Login Page
 * Streamlined login experience for customers
 */

const CustomerLogin = () => {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError, showSuccess } = useNotifications();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      showSuccess('Welcome back!', 'You have been successfully logged in.');
    } else {
      showError('Login Failed', result.error || 'Please check your credentials and try again.');
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-st-primary-50 to-st-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-st-primary-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-st-text-primary mb-2">
            Welcome to SwiftTiger
          </h1>
          <p className="text-st-text-secondary">
            Customer Portal
          </p>
        </div>

        {/* Login Form */}
        <Card variant="elevated" padding="lg">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <FormGroup
                  label="Email Address"
                  required
                  error={error && error.includes('email') ? error : ''}
                >
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </FormGroup>

                <FormGroup
                  label="Password"
                  required
                  error={error && error.includes('password') ? error : ''}
                >
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-st-text-tertiary hover:text-st-text-secondary transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    }
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                </FormGroup>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-st-border-primary text-st-primary-500 focus:ring-st-primary-500"
                  />
                  <span className="text-sm text-st-text-secondary">Remember me</span>
                </label>

                <button
                  type="button"
                  className="text-sm text-st-primary-600 hover:text-st-primary-800 transition-colors"
                  onClick={() => {
                    // TODO: Implement forgot password
                    showError('Coming Soon', 'Password reset feature will be available soon.');
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* General Error Display */}
              {error && !error.includes('email') && !error.includes('password') && (
                <div className="p-3 bg-st-error-50 border border-st-error-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-st-error-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-st-error-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size={responsive.isMobile ? 'lg' : 'md'}
                fullWidth
                disabled={!isFormValid || isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-st-text-secondary">
            Need an account?{' '}
            <button
              onClick={() => {
                // TODO: Implement customer registration
                showError('Coming Soon', 'Customer registration will be available soon. Please contact support for account setup.');
              }}
              className="text-st-primary-600 hover:text-st-primary-800 font-medium transition-colors"
            >
              Contact Support
            </button>
          </p>
          
          <div className="mt-4 pt-4 border-t border-st-border-primary">
            <p className="text-xs text-st-text-tertiary">
              © 2024 SwiftTiger. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;