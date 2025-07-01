/**
 * Toast Notification System for SwiftTiger Frontend
 * Provides centralized toast notifications with different types and configurations
 */

import { UI_TEXT } from "../config/constants";

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// Toast Positions
export const TOAST_POSITIONS = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  TOP_CENTER: "top-center",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_CENTER: "bottom-center",
};

// Default Configuration
const DEFAULT_CONFIG = {
  duration: 5000,
  position: TOAST_POSITIONS.TOP_RIGHT,
  maxToasts: 5,
  animationDuration: 300,
};

class ToastManager {
  constructor() {
    this.toasts = [];
    this.config = { ...DEFAULT_CONFIG };
    this.container = null;
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    if (typeof window === "undefined") return;

    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = `fixed z-50 ${this.getPositionClasses()}`;
      document.body.appendChild(this.container);
    }

    // Set up global error handler
    this.setupGlobalErrorHandler();
  }

  /**
   * Get CSS classes for toast position
   */
  getPositionClasses() {
    const positionClasses = {
      [TOAST_POSITIONS.TOP_LEFT]: "top-4 left-4",
      [TOAST_POSITIONS.TOP_RIGHT]: "top-4 right-4",
      [TOAST_POSITIONS.TOP_CENTER]: "top-4 left-1/2 transform -translate-x-1/2",
      [TOAST_POSITIONS.BOTTOM_LEFT]: "bottom-4 left-4",
      [TOAST_POSITIONS.BOTTOM_RIGHT]: "bottom-4 right-4",
      [TOAST_POSITIONS.BOTTOM_CENTER]:
        "bottom-4 left-1/2 transform -translate-x-1/2",
    };

    return (
      positionClasses[this.config.position] ||
      positionClasses[TOAST_POSITIONS.TOP_RIGHT]
    );
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   */
  show(message, options = {}) {
    const toast = this.createToast(message, options);
    this.addToast(toast);
    this.scheduleRemoval(toast);
  }

  /**
   * Create toast element
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {Object} Toast object
   */
  createToast(message, options = {}) {
    const {
      type = TOAST_TYPES.INFO,
      duration = this.config.duration,
      title,
      action,
      dismissible = true,
      id = this.generateId(),
    } = options;

    const toastElement = document.createElement("div");
    toastElement.id = `toast-${id}`;
    toastElement.className = this.getToastClasses(type);
    toastElement.innerHTML = this.getToastHTML(
      message,
      title,
      action,
      dismissible
    );

    return {
      id,
      element: toastElement,
      type,
      duration,
      message,
      title,
      action,
      dismissible,
      createdAt: Date.now(),
    };
  }

  /**
   * Get CSS classes for toast type
   * @param {string} type - Toast type
   * @returns {string} CSS classes
   */
  getToastClasses(type) {
    const baseClasses =
      "mb-4 p-4 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-in-out";

    const typeClasses = {
      [TOAST_TYPES.SUCCESS]:
        "bg-green-50 border border-green-200 text-green-800",
      [TOAST_TYPES.ERROR]: "bg-red-50 border border-red-200 text-red-800",
      [TOAST_TYPES.WARNING]:
        "bg-yellow-50 border border-yellow-200 text-yellow-800",
      [TOAST_TYPES.INFO]: "bg-blue-50 border border-blue-200 text-blue-800",
    };

    return `${baseClasses} ${
      typeClasses[type] || typeClasses[TOAST_TYPES.INFO]
    }`;
  }

  /**
   * Get toast HTML content
   * @param {string} message - Toast message
   * @param {string} title - Toast title
   * @param {Object} action - Toast action
   * @param {boolean} dismissible - Whether toast is dismissible
   * @returns {string} HTML content
   */
  getToastHTML(message, title, action, dismissible) {
    let html = '<div class="flex items-start">';

    // Icon
    html += `<div class="flex-shrink-0 mr-3">${this.getIcon(
      title ? "info" : "message"
    )}</div>`;

    // Content
    html += '<div class="flex-1 min-w-0">';
    if (title) {
      html += `<h4 class="text-sm font-medium mb-1">${title}</h4>`;
    }
    html += `<p class="text-sm">${message}</p>`;

    // Action button
    if (action) {
      html += `<button class="mt-2 text-xs font-medium underline hover:no-underline" onclick="window.toastAction('${action.id}')">${action.label}</button>`;
    }

    html += "</div>";

    // Close button
    if (dismissible) {
      html += `<button class="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="window.dismissToast('${id}')">${this.getCloseIcon()}</button>`;
    }

    html += "</div>";
    return html;
  }

  /**
   * Get icon for toast type
   * @param {string} type - Icon type
   * @returns {string} SVG icon
   */
  getIcon(type) {
    const icons = {
      success:
        '<svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
      error:
        '<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
      warning:
        '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      info: '<svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
      message:
        '<svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
    };

    return icons[type] || icons.message;
  }

  /**
   * Get close icon
   * @returns {string} SVG close icon
   */
  getCloseIcon() {
    return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
  }

  /**
   * Add toast to container
   * @param {Object} toast - Toast object
   */
  addToast(toast) {
    // Remove oldest toast if max limit reached
    if (this.toasts.length >= this.config.maxToasts) {
      const oldestToast = this.toasts.shift();
      this.removeToast(oldestToast);
    }

    this.toasts.push(toast);
    this.container.appendChild(toast.element);

    // Trigger entrance animation
    setTimeout(() => {
      toast.element.classList.add("translate-y-0", "opacity-100");
    }, 10);
  }

  /**
   * Remove toast from container
   * @param {Object} toast - Toast object
   */
  removeToast(toast) {
    if (!toast || !toast.element) return;

    // Trigger exit animation
    toast.element.classList.add("-translate-y-2", "opacity-0");

    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts = this.toasts.filter((t) => t.id !== toast.id);
    }, this.config.animationDuration);
  }

  /**
   * Schedule toast removal
   * @param {Object} toast - Toast object
   */
  scheduleRemoval(toast) {
    if (toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, toast.duration);
    }
  }

  /**
   * Dismiss specific toast
   * @param {string} id - Toast ID
   */
  dismiss(id) {
    const toast = this.toasts.find((t) => t.id === id);
    if (toast) {
      this.removeToast(toast);
    }
  }

  /**
   * Clear all toasts
   */
  clear() {
    this.toasts.forEach((toast) => this.removeToast(toast));
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Setup global error handler integration
   */
  setupGlobalErrorHandler() {
    // Make toast methods globally available for onclick handlers
    window.dismissToast = (id) => this.dismiss(id);
    window.toastAction = (actionId) => this.handleAction(actionId);
  }

  /**
   * Handle toast action
   * @param {string} actionId - Action ID
   */
  handleAction(actionId) {
    // This can be extended to handle specific actions
    console.log("Toast action triggered:", actionId);
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };

    // Update container position if changed
    if (config.position && this.container) {
      this.container.className = `fixed z-50 ${this.getPositionClasses()}`;
    }
  }

  /**
   * Success toast
   * @param {string} message - Success message
   * @param {Object} options - Toast options
   */
  success(message, options = {}) {
    this.show(message, { type: TOAST_TYPES.SUCCESS, ...options });
  }

  /**
   * Error toast
   * @param {string} message - Error message
   * @param {Object} options - Toast options
   */
  error(message, options = {}) {
    this.show(message, { type: TOAST_TYPES.ERROR, ...options });
  }

  /**
   * Warning toast
   * @param {string} message - Warning message
   * @param {Object} options - Toast options
   */
  warning(message, options = {}) {
    this.show(message, { type: TOAST_TYPES.WARNING, ...options });
  }

  /**
   * Info toast
   * @param {string} message - Info message
   * @param {Object} options - Toast options
   */
  info(message, options = {}) {
    this.show(message, { type: TOAST_TYPES.INFO, ...options });
  }
}

// Create singleton instance
const toastManager = new ToastManager();

// Export convenience methods
export const toast = {
  show: (message, options) => toastManager.show(message, options),
  success: (message, options) => toastManager.success(message, options),
  error: (message, options) => toastManager.error(message, options),
  warning: (message, options) => toastManager.warning(message, options),
  info: (message, options) => toastManager.info(message, options),
  dismiss: (id) => toastManager.dismiss(id),
  clear: () => toastManager.clear(),
  updateConfig: (config) => toastManager.updateConfig(config),
};

export default toast;
