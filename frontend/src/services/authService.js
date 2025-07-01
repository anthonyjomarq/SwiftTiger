import BaseApi from "./baseApi.js";
import { API_ENDPOINTS } from "../config/constants";

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */

/**
 * @typedef {Object} RegisterData
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} [role] - User's role (optional)
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token - JWT access token
 * @property {string} refreshToken - JWT refresh token
 * @property {Object} user - User information
 */

/**
 * @typedef {Object} RefreshTokenData
 * @property {string} refreshToken - JWT refresh token
 */

/**
 * Authentication service for handling user authentication and authorization
 * @class AuthService
 * @extends BaseApi
 */
class AuthService extends BaseApi {
  /**
   * Create a new AuthService instance
   * @param {Object} config - Configuration for the API instance
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Authenticate user with email and password
   * @param {LoginCredentials} credentials - User login credentials
   * @returns {Promise<AuthResponse>} Authentication response with tokens and user data
   * @throws {Error} When authentication fails
   */
  async login(credentials) {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.AUTH.LOGIN,
        data: credentials,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register a new user account
   * @param {RegisterData} userData - User registration data
   * @returns {Promise<AuthResponse>} Authentication response with tokens and user data
   * @throws {Error} When registration fails
   */
  async register(userData) {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.AUTH.REGISTER,
        data: userData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh authentication token using refresh token
   * @param {RefreshTokenData} refreshData - Refresh token data
   * @returns {Promise<AuthResponse>} New authentication response with tokens
   * @throws {Error} When token refresh fails
   */
  async refresh(refreshData) {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.AUTH.REFRESH,
        data: refreshData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user information
   * @returns {Promise<Object>} Current user information
   * @throws {Error} When user data retrieval fails
   */
  async getCurrentUser() {
    try {
      const response = await this.request({
        method: "GET",
        url: API_ENDPOINTS.AUTH.ME,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout current user and invalidate tokens
   * @returns {Promise<Object>} Logout confirmation
   * @throws {Error} When logout fails
   */
  async logout() {
    try {
      const response = await this.request({
        method: "POST",
        url: API_ENDPOINTS.AUTH.LOGOUT,
      });

      // Clear local storage tokens
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      return response.data;
    } catch (error) {
      // Clear tokens even if logout request fails
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} True if user has valid token
   */
  isAuthenticated() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      // Basic token validation (check if not expired)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      // Invalid token format
      localStorage.removeItem("token");
      return false;
    }
  }

  /**
   * Get stored authentication token
   * @returns {string|null} Stored JWT token or null if not found
   */
  getToken() {
    return localStorage.getItem("token");
  }

  /**
   * Get stored refresh token
   * @returns {string|null} Stored refresh token or null if not found
   */
  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  }

  /**
   * Store authentication tokens
   * @param {string} token - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(token, refreshToken) {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
  }

  /**
   * Clear stored authentication tokens
   */
  clearTokens() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
