import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from '../../shared/components/NotificationHub';

const OfflineContext = createContext({});

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showSuccess, showError, showInfo } = useNotifications();

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tech_pending_actions');
    if (saved) {
      try {
        setPendingActions(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse pending actions:', error);
        localStorage.removeItem('tech_pending_actions');
      }
    }
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tech_pending_actions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo('Connection Restored', 'Back online - syncing data...');
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showInfo('Connection Lost', 'Working offline - data will sync when online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingActions]);

  const addPendingAction = (action) => {
    const actionWithId = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    setPendingActions(prev => [...prev, actionWithId]);
    
    // Try to sync immediately if online
    if (isOnline) {
      setTimeout(syncPendingData, 1000);
    }
  };

  const removePendingAction = (actionId) => {
    setPendingActions(prev => prev.filter(action => action.id !== actionId));
  };

  const clearPendingActions = () => {
    setPendingActions([]);
    localStorage.removeItem('tech_pending_actions');
  };

  const syncPendingData = async () => {
    if (!isOnline || pendingActions.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    const failedActions = [];

    for (const action of pendingActions) {
      try {
        await processAction(action);
        // Remove successful action
        removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        failedActions.push(action);
      }
    }

    setIsSyncing(false);

    if (failedActions.length === 0) {
      showSuccess('Sync Complete', 'All offline data synced successfully');
    } else if (failedActions.length < pendingActions.length) {
      showInfo('Partial Sync', `${pendingActions.length - failedActions.length} items synced, ${failedActions.length} failed`);
    } else {
      showError('Sync Failed', 'Unable to sync offline data');
    }
  };

  const processAction = async (action) => {
    const token = localStorage.getItem('tech_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    switch (action.type) {
      case 'UPDATE_JOB_STATUS':
        return await syncJobStatusUpdate(action.data, token);
      
      case 'ADD_JOB_NOTE':
        return await syncJobNote(action.data, token);
      
      case 'UPLOAD_PHOTO':
        return await syncPhotoUpload(action.data, token);
      
      case 'SAVE_SIGNATURE':
        return await syncSignature(action.data, token);
      
      case 'UPDATE_LOCATION':
        return await syncLocationUpdate(action.data, token);
      
      case 'CLOCK_IN_OUT':
        return await syncTimeEntry(action.data, token);
      
      case 'RECORD_COMPLETION_LOCATION':
        return await syncCompletionLocation(action.data, token);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  const syncJobStatusUpdate = async (data, token) => {
    const response = await fetch(`/api/jobs/${data.jobId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: data.status,
        notes: data.notes,
        updated_at: new Date(data.timestamp).toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncJobNote = async (data, token) => {
    const response = await fetch(`/api/jobs/${data.jobId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        note: data.note,
        created_at: new Date(data.timestamp).toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncPhotoUpload = async (data, token) => {
    const formData = new FormData();
    formData.append('photo', data.photo);
    if (data.jobId) {
      formData.append('jobId', data.jobId);
    }
    formData.append('type', 'job_photo');
    formData.append('timestamp', new Date(data.timestamp).toISOString());

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncSignature = async (data, token) => {
    const formData = new FormData();
    formData.append('signature', data.signature);
    formData.append('customerName', data.customerName);
    formData.append('type', data.type);
    if (data.jobId) {
      formData.append('jobId', data.jobId);
    }
    formData.append('timestamp', new Date(data.timestamp).toISOString());

    const response = await fetch('/api/signatures/save', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncLocationUpdate = async (data, token) => {
    const response = await fetch('/api/technician/location', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        timestamp: new Date(data.timestamp).toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncTimeEntry = async (data, token) => {
    const response = await fetch('/api/timesheet/entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: data.type, // 'clock_in' or 'clock_out'
        jobId: data.jobId,
        location: data.location,
        timestamp: new Date(data.timestamp).toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncCompletionLocation = async (data, token) => {
    const response = await fetch('/api/routes/job-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId: data.jobId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        nextJobId: data.nextJobId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const getOfflineStats = () => {
    return {
      totalPending: pendingActions.length,
      pendingByType: pendingActions.reduce((acc, action) => {
        acc[action.type] = (acc[action.type] || 0) + 1;
        return acc;
      }, {}),
      oldestPending: pendingActions.length > 0 
        ? Math.min(...pendingActions.map(a => a.timestamp))
        : null,
    };
  };

  const value = {
    isOnline,
    pendingActions,
    isSyncing,
    addPendingAction,
    removePendingAction,
    clearPendingActions,
    syncPendingData,
    getOfflineStats,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};