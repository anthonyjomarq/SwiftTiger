import { StoredUser, UserRole } from '@/types/auth';

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUser = (): StoredUser | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setAuth = (token: string, user: StoredUser): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

export const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
  const user = getUser();
  if (!user) return false;
  
  if (typeof requiredRoles === 'string') {
    return user.role === requiredRoles;
  }
  
  return requiredRoles.includes(user.role);
};

export const isMainAdmin = (): boolean => {
  const user = getUser();
  return user?.isMainAdmin === true;
};