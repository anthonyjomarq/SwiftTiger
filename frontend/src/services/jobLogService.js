import api from '../utils/api';

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
};