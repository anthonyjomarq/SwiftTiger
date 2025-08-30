import { User } from '../types';
import { userService as realUserService } from './userService';
import { demoUserService } from './demoBackendService';

// Check if in demo mode
const isDemoMode = (): boolean => {
  try {
    const saved = localStorage.getItem('swifttiger-demo-mode');
    return saved !== null ? JSON.parse(saved) : true; // Default to demo mode
  } catch {
    return true; // Default to demo mode if localStorage fails
  }
};

export const userService = {
  async getUsers(): Promise<User[]> {
    if (isDemoMode()) {
      const { data } = await demoUserService.getAll();
      return data;
    }
    return realUserService.getUsers();
  },

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    if (isDemoMode()) {
      const { data } = await demoUserService.create(user);
      return data;
    }
    return realUserService.createUser(user);
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    if (isDemoMode()) {
      const { data } = await demoUserService.update(id, user);
      return data;
    }
    return realUserService.updateUser(id, user);
  },

  async deleteUser(id: string): Promise<void> {
    if (isDemoMode()) {
      await demoUserService.delete(id);
      return;
    }
    return realUserService.deleteUser(id);
  }
};