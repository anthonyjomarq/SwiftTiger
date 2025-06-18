import api from "./api";

export const logsService = {
  async getLogs(params = {}) {
    const response = await api.get("/logs", { params });
    return response.data.data;
  },
};
