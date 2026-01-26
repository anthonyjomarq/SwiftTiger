import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Eye, EyeOff, Play, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/shared/services/wrappers/authServiceWrapper';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useDemoMode } from '@/demo/contexts/DemoModeContext';

interface LoginFormData {
  email: string;
  password: string;
}

export function Login() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const { enableDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true);
    try {
      const { user } = await authService.login(data.email, data.password);
      login(user);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Enable demo mode for the session
    enableDemoMode();

    const demoUser = {
      id: 'demo-admin',
      email: 'admin@swifttiger.com',
      name: 'Demo Admin',
      role: 'admin' as const,
      permissions: ['all']
    };

    login(demoUser);
    toast.success('Welcome to the SwiftTiger demo!');
    navigate('/');
  };

  const handleTogglePassword = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">ST</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            SwiftTiger
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Field Service Management System
          </p>
        </div>

        {/* Demo Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800 mb-1">
            <strong>Portfolio Demo</strong>
          </p>
          <p className="text-xs text-blue-600">
            Click below to explore the app with sample data
          </p>
        </div>

        {/* Primary Demo Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Play className="h-5 w-5 mr-3" />
          Try Demo — No Login Required
        </button>

        {/* Expandable Login Form */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowLoginForm(!showLoginForm)}
            className="w-full flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showLoginForm ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide login form
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Sign in with credentials
              </>
            )}
          </button>

          {showLoginForm && (
            <form className="mt-4 space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={handleTogglePassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Built with React, TypeScript, and Tailwind CSS
        </p>
      </div>
    </div>
  );
}