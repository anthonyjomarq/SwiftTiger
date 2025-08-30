import { jobLogService } from './jobLogService';
import { demoBackendService } from './demoBackendService';
import { JobLog, JobLogFormData } from '../types';

// Check if we're in demo mode by checking localStorage
const isDemoMode = (): boolean => {
  try {
    return localStorage.getItem('swifttiger-demo-mode') === 'true';
  } catch {
    return true; // Default to demo mode if localStorage is not available
  }
};

export const jobLogServiceWrapper = {
  async getJobLogs(jobId: string): Promise<JobLog[]> {
    if (isDemoMode()) {
      return demoBackendService.getJobLogs(jobId);
    }
    return jobLogService.getJobLogs(jobId);
  },

  async createJobLog(jobId: string, formData: FormData): Promise<JobLog> {
    if (isDemoMode()) {
      // Convert FormData to object for demo service
      const data: any = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return demoBackendService.createJobLog(jobId, data);
    }
    return jobLogService.createJobLog(jobId, formData);
  },

  async updateJobLog(jobId: string, logId: string, formData: FormData): Promise<JobLog> {
    if (isDemoMode()) {
      // Convert FormData to object for demo service
      const data: any = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return demoBackendService.updateJobLog(jobId, logId, data);
    }
    return jobLogService.updateJobLog(jobId, logId, formData);
  },

  async deleteJobLog(jobId: string, logId: string): Promise<any> {
    if (isDemoMode()) {
      return demoBackendService.deleteJobLog(jobId, logId);
    }
    return jobLogService.deleteJobLog(jobId, logId);
  },
};