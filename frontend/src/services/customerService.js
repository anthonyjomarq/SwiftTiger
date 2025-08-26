import api from '../utils/api.ts';

export const customerService = {
  async getCustomers(params = {}) {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  async getCustomer(id) {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data) {
    const response = await api.post('/customers', data);
    return response.data;
  },

  async updateCustomer(id, data) {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};