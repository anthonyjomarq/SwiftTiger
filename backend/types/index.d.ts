// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "manager" | "dispatcher" | "technician";
  isMainAdmin: boolean;
  isActive: boolean;
  lastLogin?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  formattedAddress?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Job Types
export interface Job {
  id: number;
  jobName: string;
  description?: string;
  customerId: number;
  customer?: Customer;
  assignedTo?: number;
  assignedUser?: User;
  serviceType:
    | "installation"
    | "maintenance"
    | "repair"
    | "inspection"
    | "consultation";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  scheduledDate: Date;
  completedDate?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  notes?: string;
  createdBy: number;
  creator?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Job Log Types
export interface JobLog {
  id: number;
  jobId: number;
  job?: Job;
  technicianId: number;
  technician?: User;
  notes: string;
  photos?: string[];
  workStartTime?: Date;
  workEndTime?: Date;
  statusUpdate?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  resource: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalCustomers: number;
  activeCustomers: number;
  totalTechnicians: number;
  activeTechnicians: number;
  todaysJobs: number;
  weeklyJobs: number;
  recentJobs: Job[];
  technicianPerformance: TechnicianPerformance[];
  priorityDistribution: PriorityDistribution;
}

export interface TechnicianPerformance {
  technicianId: number;
  technicianName: string;
  completedJobs: number;
  averageDuration: number;
  rating?: number;
}

export interface PriorityDistribution {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}
