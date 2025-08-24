import { Request, Response } from 'express';
import { User, Customer, Job, JobLog, AuditLog } from './index.js';

// Extend User type for audit logging
export interface AuditUser extends User {
  ipAddress?: string;
  userAgent?: string;
}

// Base types
export interface AuthenticatedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: AuditUser;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth route types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isMainAdmin: boolean;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User route types
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'dispatcher' | 'technician';
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'dispatcher' | 'technician';
  isActive?: boolean;
}

export interface UserResponse extends Partial<Omit<User, 'password'>> {
  Creator?: Partial<User>;
}

export interface UsersListResponse extends PaginatedResponse<UserResponse> {
  users?: UserResponse[];
}

// Customer route types
export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  addressPlaceId?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  addressCountry?: string;
}

export interface CustomerResponse extends Partial<Customer> {
  Creator?: Partial<User>;
  Updater?: Partial<User>;
}

export interface CustomersListResponse extends PaginatedResponse<CustomerResponse> {
  customers?: CustomerResponse[];
}

// Job route types
export interface CreateJobRequest {
  jobName: string;
  description: string;
  customerId: string;
  serviceType: 'New Account' | 'Replacement' | 'Training' | 'Maintenance';
  priority?: 'Low' | 'Medium' | 'High';
  assignedTo?: string;
  scheduledDate?: Date | string;
  estimatedDuration?: number;
}

export interface UpdateJobRequest {
  jobName?: string;
  description?: string;
  serviceType?: 'New Account' | 'Replacement' | 'Training' | 'Maintenance';
  priority?: 'Low' | 'Medium' | 'High';
  assignedTo?: string;
  scheduledDate?: Date | string;
  estimatedDuration?: number;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface JobResponse extends Job {
  Customer?: Partial<Customer>;
  AssignedTechnician?: Partial<User>;
  Creator?: Partial<User>;
}

export interface JobsListResponse extends PaginatedResponse<JobResponse> {
  jobs?: JobResponse[];
}

// Job log types
export interface CreateJobLogRequest {
  notes: string;
  workStartTime?: Date | string;
  workEndTime?: Date | string;
  statusUpdate?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface JobLogResponse extends Partial<JobLog> {
  Technician?: Partial<User>;
}

// Dashboard route types
export interface DashboardStatsResponse {
  totalCustomers: number;
  activeJobs: number;
  pendingJobs: number;
  completedToday: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  totalUsers: number;
}

// Audit route types
export interface AuditLogResponse extends Partial<AuditLog> {
  User?: Partial<User>;
}

export interface AuditLogsListResponse extends PaginatedResponse<AuditLogResponse> {
  logs?: AuditLogResponse[];
}

export interface AuditStatsResponse {
  actionStats: Array<{
    _id: string;
    count: number;
  }>;
  userStats: Array<{
    userName?: string;
    userEmail?: string;
    count: number;
  }>;
}

// Error response type
export interface ErrorResponse {
  message: string;
  error?: string;
}

// Query parameter types
export interface UsersQuery {
  role?: string;
}

export interface JobsQuery {
  page?: string;
  limit?: string;
  status?: string;
  assignedTo?: string;
  customerId?: string;
  scheduledDate?: string;
}

export interface CustomersQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export interface AuditLogsQuery {
  page?: string;
  limit?: string;
  action?: string;
  resource?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStatsQuery {
  startDate?: string;
  endDate?: string;
}