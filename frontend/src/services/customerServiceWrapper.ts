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
      
      // Apply client-side filtering for demo
      let filteredCustomers = data;
      
      // Search filter
      if (params.search && params.search.trim()) {
        const searchLower = params.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.addressCity.toLowerCase().includes(searchLower) ||
          customer.businessType?.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower)
        );
      }
      
      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + limit);
      
      return {
        customers: paginatedCustomers,
        total: filteredCustomers.length,
        page,
        limit
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