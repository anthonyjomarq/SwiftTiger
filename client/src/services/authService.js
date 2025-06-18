import api from "./api";
import { tokenManager } from "../utils/tokenManager";

export const authService = {
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const { token, refreshToken, user } = response.data.data;

    tokenManager.setTokens(token, refreshToken);
    return { user, token };
  },

  async register(userData) {
    const response = await api.post("/auth/register", userData);
    const { token, refreshToken, user } = response.data.data;

    tokenManager.setTokens(token, refreshToken);
    return { user, token };
  },

  async logout() {
    tokenManager.removeTokens();
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    const { token, refreshToken } = response.data.data;

    tokenManager.setTokens(token, refreshToken);
    return response.data;
  },

  async refreshToken() {
    const refreshToken = tokenManager.getRefreshToken();
    const response = await api.post("/auth/refresh", { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    tokenManager.setTokens(accessToken, newRefreshToken);
    return response.data;
  },
};
