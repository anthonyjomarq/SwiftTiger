import api from "./api";

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get("/users", { params });
    return response.data.data;
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data) {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async updateUser(id, data) {
    const response = await api.patch(`/users/${id}`, data);
    return response.data.data;
  },

  async deactivateUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async activateUser(id) {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
  },

  async getUserStats() {
    const response = await api.get("/users/stats");
    return response.data.data;
  },
};
