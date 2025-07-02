import React, { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '../utils/cn';

/**
 * Universal Notification System
 * Handles in-app, email, SMS, and push notifications
 */

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider
export const NotificationProvider = ({ children, maxNotifications = 5 }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add notification
  const addNotification = (notification) => {
    const id = notification.id || Date.now().toString();
    const newNotification = {
      id,
      type: 'info',
      title: '',
      message: '',
      timestamp: new Date(),
      read: false,
      persistent: false,
      actions: [],
      ...notification,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      return updated;
    });

    setUnreadCount(prev => prev + 1);

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration || 5000);
    }

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  // Mark as read
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification => {
      if (notification.id === id && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
        return { ...notification, read: true };
      }
      return notification;
    }));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Preset notification types
  const showSuccess = (title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  };

  const showError = (title, message, options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true,
      ...options,
    });
  };

  const showWarning = (title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  };

  const showInfo = (title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Toast notification component
export const Toast = ({ notification, onClose, onAction }) => {
  const typeStyles = {
    success: 'border-st-success-200 bg-st-success-50 text-st-success-800',
    error: 'border-st-error-200 bg-st-error-50 text-st-error-800',
    warning: 'border-st-warning-200 bg-st-warning-50 text-st-warning-800',
    info: 'border-st-info-200 bg-st-info-50 text-st-info-800',
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={cn(
      'border rounded-lg p-4 shadow-lg max-w-sm w-full',
      'transform transition-all duration-300 ease-in-out',
      typeStyles[notification.type]
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <span className="text-lg">
            {typeIcons[notification.type]}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="font-medium text-sm">
              {notification.title}
            </p>
          )}
          
          {notification.message && (
            <p className={cn(
              'text-sm',
              notification.title ? 'mt-1' : ''
            )}>
              {notification.message}
            </p>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onAction?.(action, notification)}
                  className="text-xs font-medium underline hover:no-underline"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onClose?.(notification)}
          className="flex-shrink-0 ml-3 text-sm opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Toast container
export const ToastContainer = ({ position = 'top-right' }) => {
  const { notifications, removeNotification } = useNotifications();

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div className={cn(
      'fixed z-50 pointer-events-none',
      positionStyles[position]
    )}>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast
              notification={notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Notification bell icon with badge
export const NotificationBell = ({ onClick, className }) => {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 text-st-text-secondary hover:text-st-text-primary',
        'transition-colors duration-150',
        className
      )}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-st-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Notification panel/dropdown
export const NotificationPanel = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    unreadCount 
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-st-border-primary z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-st-border-primary">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-st-text-primary">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-st-primary-100 text-st-primary-800 px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h3>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-st-primary-600 hover:text-st-primary-800"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-xs text-st-text-secondary hover:text-st-text-primary"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-st-text-secondary">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Individual notification item
const NotificationItem = ({ notification, onMarkAsRead }) => {
  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div
      className={cn(
        'px-4 py-3 border-b border-st-border-primary last:border-b-0',
        'hover:bg-st-gray-50 cursor-pointer transition-colors',
        !notification.read && 'bg-st-primary-50'
      )}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">
            {typeIcons[notification.type]}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className={cn(
              'text-sm font-medium',
              notification.read ? 'text-st-text-secondary' : 'text-st-text-primary'
            )}>
              {notification.title}
            </p>
          )}
          
          {notification.message && (
            <p className={cn(
              'text-sm',
              notification.read ? 'text-st-text-tertiary' : 'text-st-text-secondary',
              notification.title ? 'mt-1' : ''
            )}>
              {notification.message}
            </p>
          )}
          
          <p className="text-xs text-st-text-tertiary mt-1">
            {formatTimestamp(notification.timestamp)}
          </p>
        </div>
        
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-st-primary-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
};

export default NotificationProvider;