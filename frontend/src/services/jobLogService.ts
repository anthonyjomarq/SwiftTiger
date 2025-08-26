import api from '../utils/api';
import { JobLog, JobLogFormData, ApiResponse } from '@/types';

export const jobLogService = {
  async getJobLogs(jobId: string): Promise<JobLog[]> {
    const response = await api.get<ApiResponse<JobLog[]>>(`/jobs/${jobId}/logs`);
    return response.data.data;
  },

  async createJobLog(jobId: string, formData: FormData): Promise<JobLog> {
    const response = await api.post<ApiResponse<JobLog>>(`/jobs/${jobId}/logs`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateJobLog(jobId: string, logId: string, formData: FormData): Promise<JobLog> {
    const response = await api.put<ApiResponse<JobLog>>(`/jobs/${jobId}/logs/${logId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteJobLog(jobId: string, logId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/jobs/${jobId}/logs/${logId}`);
    return response.data;
  },
};