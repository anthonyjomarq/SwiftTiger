import api from '@/shared/utils/api';
import { Customer, CustomerQueryParams, ApiResponse } from '@/types';

interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export const customerService = {
  async getCustomers(params: CustomerQueryParams = {}): Promise<CustomerListResponse> {
    const response = await api.get<ApiResponse<CustomerListResponse>>('/customers', { params });
    return response.data.data;
  },

  async getCustomer(id: string): Promise<Customer> {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  async deleteCustomer(id: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/customers/${id}`);
    return response.data;
  },
};