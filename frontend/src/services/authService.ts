import api from '../utils/api';
import { setAuth, clearAuth } from '../utils/auth';
import { User, ApiResponse } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { 
      email, 
      password 
    });
    const { token, user } = response.data.data;
    
    setAuth(token, user);
    return { token, user };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};