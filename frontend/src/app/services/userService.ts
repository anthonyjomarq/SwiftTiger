import api from '@/shared/utils/api';
import { User, UserQueryParams, ApiResponse } from '@/types';

// interface UserListResponse {
//   users: User[];
//   total: number;
//   page: number;
//   limit: number;
// }

export const userService = {
  async getUsers(params: UserQueryParams = {}): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return response.data.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },
};