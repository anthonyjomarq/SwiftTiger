import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Eye, EyeOff, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authServiceWrapper';
import { useAuth } from '../contexts/AuthContext';
import { useDemoMode } from '../contexts/DemoModeContext';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const { isDemoMode } = useDemoMode();
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
    const demoUser = {
      id: 'demo-user',
      email: 'demo@swifttiger.com',
      name: 'Demo User',
      role: 'admin',
      permissions: ['all']
    };
    
    login(demoUser);
    toast.success('Welcome to the demo!');
    navigate('/');
  };

  const handleTogglePassword = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to SwiftTiger
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Field Service Management System
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={handleTogglePassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {isDemoMode && (
            <div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-3"
              >
                <Play className="h-4 w-4 mr-2" />
                Demo Login (No credentials needed)
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default Login;