import api from '../utils/api.ts';

export const jobLogService = {
  async getJobLogs(jobId) {
    const response = await api.get(`/jobs/${jobId}/logs`);
    return response.data;
  },

  async createJobLog(jobId, formData) {
    const response = await api.post(`/jobs/${jobId}/logs`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateJobLog(jobId, logId, formData) {
    const response = await api.put(`/jobs/${jobId}/logs/${logId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteJobLog(jobId, logId) {
    const response = await api.delete(`/jobs/${jobId}/logs/${logId}`);
    return response.data;
  },
};