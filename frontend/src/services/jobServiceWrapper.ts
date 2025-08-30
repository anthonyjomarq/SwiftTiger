import { Job, JobQueryParams } from '../types';
import { jobService as realJobService } from './jobService';
import { demoJobService } from './demoBackendService';

// Check if in demo mode
const isDemoMode = (): boolean => {
  try {
    const saved = localStorage.getItem('swifttiger-demo-mode');
    return saved !== null ? JSON.parse(saved) : true; // Default to demo mode
  } catch {
    return true; // Default to demo mode if localStorage fails
  }
};

interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export const jobService = {
  async getJobs(params: JobQueryParams = {}): Promise<JobListResponse> {
    if (isDemoMode()) {
      const { data } = await demoJobService.getAll();
      return {
        jobs: data,
        total: data.length,
        page: params.page || 1,
        limit: params.limit || 10
      };
    }
    return realJobService.getJobs(params);
  },

  async getJob(id: string): Promise<Job> {
    if (isDemoMode()) {
      const { data } = await demoJobService.getById(id);
      return data;
    }
    return realJobService.getJob(id);
  },

  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'Customer' | 'assignedUser'>): Promise<Job> {
    if (isDemoMode()) {
      const { data } = await demoJobService.create(job);
      return data;
    }
    return realJobService.createJob(job);
  },

  async updateJob(id: string, job: Partial<Job>): Promise<Job> {
    if (isDemoMode()) {
      const { data } = await demoJobService.update(id, job);
      return data;
    }
    return realJobService.updateJob(id, job);
  },

  async deleteJob(id: string): Promise<void> {
    if (isDemoMode()) {
      await demoJobService.delete(id);
      return;
    }
    return realJobService.deleteJob(id);
  },

  async getJobsByDate(date: string): Promise<Job[]> {
    if (isDemoMode()) {
      const { data } = await demoJobService.getAll();
      const selectedDate = new Date(date);
      return data.filter(job => {
        const jobDate = new Date(job.scheduledDate);
        return jobDate.toDateString() === selectedDate.toDateString();
      });
    }
    return realJobService.getJobsByDate(date);
  }
};