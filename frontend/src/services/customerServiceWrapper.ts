import { Customer, CustomerQueryParams } from '../types';
import { customerService as realCustomerService } from './customerService';
import { demoCustomerService } from './demoBackendService';

// Check if in demo mode
const isDemoMode = (): boolean => {
  try {
    const saved = localStorage.getItem('swifttiger-demo-mode');
    return saved !== null ? JSON.parse(saved) : true; // Default to demo mode
  } catch {
    return true; // Default to demo mode if localStorage fails
  }
};

interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export const customerService = {
  async getCustomers(params: CustomerQueryParams = {}): Promise<CustomerListResponse> {
    if (isDemoMode()) {
      const { data } = await demoCustomerService.getAll();
      return {
        customers: data,
        total: data.length,
        page: params.page || 1,
        limit: params.limit || 10
      };
    }
    return realCustomerService.getCustomers(params);
  },

  async getCustomer(id: string): Promise<Customer> {
    if (isDemoMode()) {
      const { data } = await demoCustomerService.getById(id);
      return data;
    }
    return realCustomerService.getCustomer(id);
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    if (isDemoMode()) {
      const { data } = await demoCustomerService.create(customer);
      return data;
    }
    return realCustomerService.createCustomer(customer);
  },

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    if (isDemoMode()) {
      const { data } = await demoCustomerService.update(id, customer);
      return data;
    }
    return realCustomerService.updateCustomer(id, customer);
  },

  async deleteCustomer(id: string): Promise<void> {
    if (isDemoMode()) {
      await demoCustomerService.delete(id);
      return;
    }
    return realCustomerService.deleteCustomer(id);
  }
};