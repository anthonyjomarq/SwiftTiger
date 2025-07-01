import BaseApi from "./baseApi.js";

/**
 * @typedef {Object} NotificationFilters
 * @property {string} [type] - Filter by notification type
 * @property {boolean} [read] - Filter by read status
 * @property {string} [priority] - Filter by priority (low, medium, high, urgent)
 * @property {Date} [startDate] - Filter notifications from this date
 * @property {Date} [endDate] - Filter notifications until this date
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Number of items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {string} [sortOrder] - Sort order (asc, desc)
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} email - Enable email notifications
 * @property {boolean} push - Enable push notifications
 * @property {boolean} sms - Enable SMS notifications
 * @property {Array<string>} [types] - Notification types to receive
 * @property {string} [quietHoursStart] - Quiet hours start time (HH:MM)
 * @property {string} [quietHoursEnd] - Quiet hours end time (HH:MM)
 */

/**
 * Notification service for handling notification-related API operations
 * @class NotificationService
 * @extends BaseApi
 */
class NotificationService extends BaseApi {
  /**
   * Create a new NotificationService instance
   * @param {Object} config - Configuration for the API instance
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Get all notifications with optional filtering and pagination
   * @param {NotificationFilters} params - Query parameters for filtering and pagination
   * @returns {Promise<Object>} Paginated list of notifications
   * @throws {Error} When notification retrieval fails
   */
  async getAll(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/notifications",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific notification by ID
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} Notification details
   * @throws {Error} When notification retrieval fails
   */
  async getById(id) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/notifications/${id}`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} Updated notification
   * @throws {Error} When notification update fails
   */
  async markRead(id) {
    try {
      const response = await this.request({
        method: "PATCH",
        url: `/notifications/${id}/read`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Update confirmation
   * @throws {Error} When bulk update fails
   */
  async markAllRead() {
    try {
      const response = await this.request({
        method: "PATCH",
        url: "/notifications/read-all",
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} Deletion confirmation
   * @throws {Error} When notification deletion fails
   */
  async delete(id) {
    try {
      const response = await this.request({
        method: "DELETE",
        url: `/notifications/${id}`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete all read notifications
   * @returns {Promise<Object>} Deletion confirmation
   * @throws {Error} When bulk deletion fails
   */
  async deleteRead() {
    try {
      const response = await this.request({
        method: "DELETE",
        url: "/notifications/delete-read",
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<Object>} Unread count
   * @throws {Error} When count retrieval fails
   */
  async getUnreadCount() {
    try {
      const response = await this.request({
        method: "GET",
        url: "/notifications/unread-count",
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get notifications by type
   * @param {string} type - Notification type
   * @param {NotificationFilters} params - Additional query parameters
   * @returns {Promise<Object>} List of notifications by type
   * @throws {Error} When notification retrieval fails
   */
  async getByType(type, params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/notifications/type/${type}`,
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get notification preferences
   * @returns {Promise<NotificationPreferences>} User's notification preferences
   * @throws {Error} When preferences retrieval fails
   */
  async getPreferences() {
    try {
      const response = await this.request({
        method: "GET",
        url: "/notifications/preferences",
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update notification preferences
   * @param {NotificationPreferences} preferences - New notification preferences
   * @returns {Promise<NotificationPreferences>} Updated preferences
   * @throws {Error} When preferences update fails
   */
  async updatePreferences(preferences) {
    try {
      const response = await this.request({
        method: "PUT",
        url: "/notifications/preferences",
        data: preferences,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Subscribe to push notifications
   * @param {Object} subscription - Push subscription data
   * @returns {Promise<Object>} Subscription confirmation
   * @throws {Error} When subscription fails
   */
  async subscribeToPush(subscription) {
    try {
      const response = await this.request({
        method: "POST",
        url: "/notifications/push-subscribe",
        data: subscription,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unsubscribe from push notifications
   * @param {string} subscriptionId - Push subscription ID
   * @returns {Promise<Object>} Unsubscription confirmation
   * @throws {Error} When unsubscription fails
   */
  async unsubscribeFromPush(subscriptionId) {
    try {
      const response = await this.request({
        method: "DELETE",
        url: `/notifications/push-subscribe/${subscriptionId}`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get notification statistics
   * @param {Object} params - Query parameters for statistics
   * @returns {Promise<Object>} Notification statistics
   * @throws {Error} When statistics retrieval fails
   */
  async getStatistics(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/notifications/statistics",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
