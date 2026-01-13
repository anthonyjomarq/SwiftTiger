// Authentication types for frontend
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'dispatcher' | 'technician';
  isMainAdmin: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type UserRole = User['role'];

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isMainAdmin: boolean;
}