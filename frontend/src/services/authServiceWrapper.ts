import { User } from '../types';
import { authService as realAuthService } from './authService';
import { demoAuthService } from './demoBackendService';

// Check if in demo mode - matches DemoModeContext logic
const isDemoMode = (): boolean => {
  try {
    const saved = localStorage.getItem('swifttiger-demo-mode');
    // If no saved value exists, default to true (demo mode)
    // Otherwise, parse the saved value
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true; // Default to demo mode if localStorage fails
  }
};

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    if (isDemoMode()) {
      return await demoAuthService.login(email, password);
    }
    return realAuthService.login(email, password);
  },

  async logout(): Promise<void> {
    if (isDemoMode()) {
      // In demo mode, just clear localStorage
      localStorage.removeItem('swifttiger-token');
      localStorage.removeItem('swifttiger-user');
      return;
    }
    return realAuthService.logout();
  },

  async getCurrentUser(): Promise<User> {
    if (isDemoMode()) {
      const userStr = localStorage.getItem('swifttiger-user');
      if (!userStr) {
        throw new Error('No user found');
      }
      return JSON.parse(userStr);
    }
    return realAuthService.getCurrentUser();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    if (isDemoMode()) {
      // In demo mode, just return success
      return { success: true, message: 'Password changed successfully (demo mode)' };
    }
    return realAuthService.changePassword(currentPassword, newPassword);
  },
};