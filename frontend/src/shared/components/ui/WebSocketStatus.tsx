import React from 'react';
import { useWebSocket } from '@/shared/contexts/WebSocketContext';

export function WebSocketStatus() {
  const { isConnected, notifications } = useWebSocket();

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } ${isConnected ? 'animate-pulse' : ''}`}
        />
        <span className={`text-xs ${
          isConnected 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Notification Count */}
      {notifications.length > 0 && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {notifications.length} updates
          </span>
        </div>
      )}
    </div>
  );
}