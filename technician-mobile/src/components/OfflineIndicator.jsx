import React, { useState } from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { MobileActionSheet } from '../../shared/components/MobileLayout';

const OfflineIndicator = ({ isOnline }) => {
  const { pendingActions, isSyncing, syncPendingData, getOfflineStats } = useOffline();
  const [showDetails, setShowDetails] = useState(false);

  if (isOnline && pendingActions.length === 0) {
    return null;
  }

  const stats = getOfflineStats();
  
  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActionTypeLabel = (type) => {
    const labels = {
      UPDATE_JOB_STATUS: 'Job Status Updates',
      ADD_JOB_NOTE: 'Job Notes',
      UPLOAD_PHOTO: 'Photo Uploads',
      SAVE_SIGNATURE: 'Signatures',
      UPDATE_LOCATION: 'Location Updates',
      CLOCK_IN_OUT: 'Time Entries',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
          isOnline 
            ? 'bg-blue-500 text-white' 
            : 'bg-yellow-500 text-yellow-900'
        }`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSyncing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <span>
              {isSyncing 
                ? 'Syncing data...' 
                : isOnline 
                  ? `${stats.totalPending} items pending sync`
                  : `Offline • ${stats.totalPending} items pending`
              }
            </span>
          </div>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <MobileActionSheet
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title="Offline Data"
      >
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">Connection Status</div>
              <div className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
          </div>

          {/* Pending Actions Summary */}
          {stats.totalPending > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Pending Actions ({stats.totalPending})</h3>
              
              {Object.entries(stats.pendingByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">{getActionTypeLabel(type)}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}

              {stats.oldestPending && (
                <div className="text-sm text-gray-600">
                  Oldest pending: {formatTime(stats.oldestPending)}
                </div>
              )}
            </div>
          )}

          {/* Sync Actions */}
          <div className="space-y-2">
            {isOnline && stats.totalPending > 0 && (
              <button
                onClick={() => {
                  syncPendingData();
                  setShowDetails(false);
                }}
                disabled={isSyncing}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            {isOnline 
              ? 'Data will sync automatically when changes are made'
              : 'Changes are saved locally and will sync when connection is restored'
            }
          </div>
        </div>
      </MobileActionSheet>
    </>
  );
};

export default OfflineIndicator;