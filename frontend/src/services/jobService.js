import api from '../utils/api';

export const jobService = {
  async getJobs(params = {}) {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  async getJob(id) {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  async getJobsByCustomer(customerId) {
    const response = await api.get('/jobs', { 
      params: { customerId } 
    });
    return response.data;
  },

  async createJob(data) {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  async updateJob(id, data) {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  async deleteJob(id) {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  async getJobLogs(jobId) {
    const response = await api.get(`/jobs/${jobId}/logs`);
    return response.data;
  },

  async createJobLog(jobId, data) {
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

    const response = await api.post(`/jobs/${jobId}/logs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};