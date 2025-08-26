import api from '../utils/api';
import { Job, JobQueryParams, JobLogFormData, JobLog, ApiResponse } from '@/types';

interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export const jobService = {
  async getJobs(params: JobQueryParams = {}): Promise<JobListResponse> {
    const response = await api.get<ApiResponse<JobListResponse>>('/jobs', { params });
    return response.data.data;
  },

  async getJob(id: string): Promise<Job> {
    const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data.data;
  },

  async getJobsByCustomer(customerId: string): Promise<JobListResponse> {
    const response = await api.get<ApiResponse<JobListResponse>>('/jobs', { 
      params: { customerId } 
    });
    return response.data.data;
  },

  async createJob(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'Customer' | 'AssignedTechnician'>): Promise<Job> {
    const response = await api.post<ApiResponse<Job>>('/jobs', data);
    return response.data.data;
  },

  async updateJob(id: string, data: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'Customer' | 'AssignedTechnician'>>): Promise<Job> {
    const response = await api.put<ApiResponse<Job>>(`/jobs/${id}`, data);
    return response.data.data;
  },

  async deleteJob(id: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/jobs/${id}`);
    return response.data;
  },

  async getJobLogs(jobId: string): Promise<JobLog[]> {
    const response = await api.get<ApiResponse<JobLog[]>>(`/jobs/${jobId}/logs`);
    return response.data.data;
  },

  async createJobLog(jobId: string, data: JobLogFormData): Promise<JobLog> {
    const formData = new FormData();
    formData.append('notes', data.notes);
    if (data.workStartTime) formData.append('workStartTime', data.workStartTime);
    if (data.workEndTime) formData.append('workEndTime', data.workEndTime);
    if (data.statusUpdate) formData.append('statusUpdate', data.statusUpdate);
    
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach(photo => {
        formData.append('photos', photo);
      });
    }

    const response = await api.post<ApiResponse<JobLog>>(`/jobs/${jobId}/logs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};