// Business domain types for SwiftTiger application
import { User, UserRole } from './index';

// Customer types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  addressLatitude?: number;
  addressLongitude?: number;
  addressPlaceId?: string;
  businessType?: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job types
export type ServiceType = 'New Account' | 'Replacement' | 'Training' | 'Maintenance';
export type JobPriority = 'Low' | 'Medium' | 'High';
export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Job {
  id: string;
  jobName: string;
  description?: string;
  customerId: string;
  serviceType: ServiceType;
  priority: JobPriority;
  status?: JobStatus;
  assignedTo?: string;
  scheduledDate: string;
  estimatedDuration?: number;
  actualDuration?: number;
  workStartTime?: Date;
  workEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  Customer?: Customer;
  AssignedTechnician?: User;
}

// Job Log types
export interface JobLog {
  id: string;
  jobId: string;
  notes: string;
  workStartTime?: string;
  workEndTime?: string;
  statusUpdate?: JobStatus;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  Job?: Job;
}

export interface JobLogFormData {
  notes: string;
  workStartTime?: string;
  workEndTime?: string;
  statusUpdate?: JobStatus;
  photos?: File[];
}

// Route optimization types
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GeographicRegion {
  center: Coordinate;
  radius: number;
}

export interface JobCluster {
  id: number;
  center: Coordinate;
  jobs: Job[];
  region: string;
  totalJobs: number;
  totalDuration: number;
  averagePriority: JobPriority;
}

export interface RouteOptimization {
  route: Job[];
  totalDistance: number;
  totalTime: number;
  estimatedCompletionTime: string;
  clusters: JobCluster[];
}

export interface TechnicianWorkload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialization?: string;
  homeBase?: string;
  assignedJobs: Job[];
  totalDuration: number;
  assignedRegions: Set<string>;
  jobCount: number;
  jobs: Job[];
}

export interface WorkloadAssignment {
  technician: TechnicianWorkload;
  jobs: Job[];
  regions: string[];
}

export interface AutoAssignmentResult {
  assignments: WorkloadAssignment[];
  workloadDistribution: TechnicianWorkload[];
  balanceScore: number;
}

// Query parameters for API calls
export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  businessType?: string;
}

export interface JobQueryParams {
  page?: number;
  limit?: number;
  customerId?: string;
  assignedTo?: string;
  status?: string;
  scheduledDate?: string;
  priority?: JobPriority;
}

export interface UserQueryParams {
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Puerto Rico specific regions
export type PuertoRicoRegion = 
  | 'San Juan Metro'
  | 'Bayamon'
  | 'Carolina' 
  | 'Guaynabo'
  | 'Caguas'
  | 'Arecibo'
  | 'Mayaguez'
  | 'Ponce'
  | 'Humacao'
  | 'Aguadilla';

export interface RegionData {
  center: Coordinate;
  radius: number;
}

export type RegionMap = Record<PuertoRicoRegion, RegionData>;

// Re-export User type from auth for convenience
export type { User, UserRole } from './auth';