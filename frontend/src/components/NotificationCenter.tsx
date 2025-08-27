import React, { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { notifications, clearNotifications } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_created':
        return '💼';
      case 'job_updated':
        return '📝';
      case 'job_status_changed':
        return '📊';
      case 'job_log_created':
        return '📝';
      case 'technician_location':
        return '📍';
      case 'system_message':
        return '🔔';
      case 'dashboard_update':
        return '📊';
      default:
        return '📢';
    }
  };

  const getNotificationTitle = (notification: any) => {
    switch (notification.type) {
      case 'job_created':
        return `New Job: ${notification.data.jobName}`;
      case 'job_updated':
        return `Job Updated: ${notification.data.jobName}`;
      case 'job_status_changed':
        return `Status Changed: ${notification.data.jobName}`;
      case 'job_log_created':
        return 'New Job Log Entry';
      case 'technician_location':
        return `Location Update: ${notification.data.technicianName}`;
      case 'system_message':
        return 'System Notification';
      case 'dashboard_update':
        return 'Dashboard Update';
      default:
        return 'Notification';
    }
  };

  const getNotificationDescription = (notification: any) => {
    switch (notification.type) {
      case 'job_created':
        return `Priority: ${notification.data.priority} • Customer: ${notification.data.Customer?.name}`;
      case 'job_updated':
        return `Updated by ${notification.data.Creator?.name || 'system'}`;
      case 'job_status_changed':
        return `Changed from ${notification.data.oldStatus} to ${notification.data.newStatus}`;
      case 'job_log_created':
        return `Log entry by ${notification.data.Technician?.name}`;
      case 'technician_location':
        return `Lat: ${notification.data.latitude?.toFixed(4)}, Lng: ${notification.data.longitude?.toFixed(4)}`;
      case 'system_message':
        return notification.data.message;
      case 'dashboard_update':
        return 'Dashboard data has been updated';
      default:
        return 'New update available';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Notification Badge */}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {notifications.length} updates
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notification, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getNotificationTitle(notification)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {getNotificationDescription(notification)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 20 && (
            <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing latest 20 of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;