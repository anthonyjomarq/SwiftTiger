import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard, MobileListItem, MobileFAB, MobileActionSheet } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useOffline } from '../contexts/OfflineContext';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { currentLocation, startTracking } = useLocation();
  const { isOnline, addPendingAction } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  const queryClient = useQueryClient();
  
  const [showStatusActions, setShowStatusActions] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Fetch today's jobs for route optimization
  const { data: todaysJobs } = useQuery({
    queryKey: ['jobs', 'today', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiRequest(`/jobs?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    },
    enabled: !!user && isOnline,
  });

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const response = await apiRequest(`/jobs/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      throw new Error('Failed to fetch job details');
    },
    enabled: !!id && isOnline,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ status, notes }) => {
      const body = { status };
      if (notes) body.notes = notes;
      if (status === 'in_progress') {
        body.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        body.completed_at = new Date().toISOString();
      }

      const response = await apiRequest(`/jobs/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['dashboard']);
      
      const statusMessages = {
        in_progress: 'Job started successfully',
        on_hold: 'Job put on hold',
        completed: 'Job completed successfully',
        cancelled: 'Job cancelled',
      };
      
      showSuccess('Status Updated', statusMessages[variables.status]);
      setShowStatusActions(false);
      setShowNotesInput(false);
      setNotes('');
    },
    onError: (error) => {
      if (!isOnline) {
        // Store for offline sync
        addPendingAction({
          type: 'UPDATE_JOB_STATUS',
          data: { jobId: id, status: variables.status, notes: variables.notes },
          timestamp: Date.now(),
        });
        showInfo('Saved Offline', 'Status will update when online');
      } else {
        showError('Error', error.message);
      }
    },
  });

  // Add notes mutation
  const notesMutation = useMutation({
    mutationFn: async (noteText) => {
      const response = await apiRequest(`/jobs/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: noteText }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job', id]);
      showSuccess('Note Added', 'Note saved successfully');
      setNotes('');
      setShowNotesInput(false);
    },
    onError: (error) => {
      if (!isOnline) {
        addPendingAction({
          type: 'ADD_JOB_NOTE',
          data: { jobId: id, note: noteText },
          timestamp: Date.now(),
        });
        showInfo('Saved Offline', 'Note will sync when online');
        setNotes('');
        setShowNotesInput(false);
      } else {
        showError('Error', error.message);
      }
    },
  });

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'in_progress' && !currentLocation) {
      startTracking();
    }
    
    // Record completion location if job is being completed
    if (newStatus === 'completed') {
      await recordCompletionLocation();
    }
    
    if (showNotesInput) {
      statusMutation.mutate({ status: newStatus, notes });
    } else {
      statusMutation.mutate({ status: newStatus });
    }
  };

  // Record location when job is completed
  const recordCompletionLocation = async () => {
    try {
      let location = currentLocation;
      
      // Try to get fresh location if we don't have one
      if (!location && navigator.geolocation) {
        try {
          location = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                });
              },
              reject,
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 30000,
              }
            );
          });
        } catch (error) {
          console.log('Could not get current location for completion tracking');
        }
      }
      
      if (location && isOnline) {
        // Find next job to help with route optimization
        const nextJob = todaysJobs?.find(j => 
          j.status === 'pending' && j.id !== parseInt(id)
        );
        
        await apiRequest('/routes/job-completion', {
          method: 'POST',
          body: JSON.stringify({
            jobId: parseInt(id),
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            nextJobId: nextJob?.id || null,
          }),
        });
      } else if (location) {
        // Store for offline sync
        addPendingAction({
          type: 'RECORD_COMPLETION_LOCATION',
          data: {
            jobId: parseInt(id),
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: Date.now(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to record completion location:', error);
      // Don't fail the job completion if location recording fails
    }
  };

  const handleAddNote = () => {
    if (notes.trim()) {
      notesMutation.mutate(notes.trim());
    }
  };

  const handleCallCustomer = () => {
    if (job?.customer_phone) {
      window.location.href = `tel:${job.customer_phone}`;
    } else {
      showError('No Phone', 'Customer phone number not available');
    }
  };

  const handleNavigate = () => {
    if (job?.address) {
      const query = encodeURIComponent(job.address);
      window.open(`https://maps.google.com/maps?q=${query}`, '_blank');
    } else {
      showError('No Address', 'Job address not available');
    }
  };

  const handleTakePhoto = () => {
    navigate('/camera', { state: { jobId: id, returnTo: `/jobs/${id}` } });
  };

  const handleGetSignature = () => {
    navigate('/signature', { state: { jobId: id, returnTo: `/jobs/${id}` } });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: '🔧', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Completed' },
      on_hold: { color: 'bg-gray-100 text-gray-800', icon: '⏸️', label: 'On Hold' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelled' },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
      emergency: 'text-red-600 font-bold',
    };
    return colors[priority] || colors.normal;
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateText;
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateText = 'Tomorrow';
    } else {
      dateText = date.toLocaleDateString();
    }
    
    if (timeString) {
      const time = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${dateText} at ${time}`;
    }
    
    return dateText;
  };

  const statusActions = [
    { id: 'start', label: 'Start Job', status: 'in_progress', color: 'text-blue-600', icon: '▶️' },
    { id: 'hold', label: 'Put on Hold', status: 'on_hold', color: 'text-yellow-600', icon: '⏸️' },
    { id: 'complete', label: 'Mark Complete', status: 'completed', color: 'text-green-600', icon: '✅' },
    { id: 'cancel', label: 'Cancel Job', status: 'cancelled', color: 'text-red-600', icon: '❌' },
  ];

  const moreActions = [
    { id: 'call', label: 'Call Customer', icon: '📞', action: handleCallCustomer },
    { id: 'navigate', label: 'Get Directions', icon: '🗺️', action: handleNavigate },
    { id: 'photo', label: 'Take Photo', icon: '📷', action: handleTakePhoto },
    { id: 'signature', label: 'Get Signature', icon: '✍️', action: handleGetSignature },
    { id: 'notes', label: 'Add Note', icon: '📝', action: () => setShowNotesInput(true) },
  ];

  if (isLoading) {
    return (
      <div className="job-detail-page">
        <MobileHeader title="Loading..." showBack />
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <MobileCard key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </MobileCard>
          ))}
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page">
        <MobileHeader title="Job Not Found" showBack />
        <div className="p-4">
          <MobileCard className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="font-semibold text-gray-900 mb-2">Job Not Found</h3>
            <p className="text-gray-600 mb-4">
              The requested job could not be found or may have been removed.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Jobs
            </button>
          </MobileCard>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <MobileHeader
        title={`Job #${job.id}`}
        showBack
        rightAction={
          <button
            onClick={() => setShowMoreActions(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Job Overview */}
        <MobileCard variant="elevated">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h1>
              <p className="text-gray-600">{job.customer_name}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(job.status).color}`}>
                {getStatusConfig(job.status).icon} {getStatusConfig(job.status).label}
              </div>
              {job.priority !== 'normal' && (
                <div className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                  {job.priority.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {job.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{job.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <MobileListItem
              leftContent={<span className="text-lg">📅</span>}
              subtitle="Scheduled"
            >
              {formatDateTime(job.scheduled_date, job.scheduled_time)}
            </MobileListItem>

            {job.estimated_duration && (
              <MobileListItem
                leftContent={<span className="text-lg">⏱️</span>}
                subtitle="Estimated Duration"
              >
                {job.estimated_duration} minutes
              </MobileListItem>
            )}

            {job.address && (
              <MobileListItem
                leftContent={<span className="text-lg">📍</span>}
                subtitle="Address"
                onClick={handleNavigate}
                rightContent={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                }
              >
                {job.address}
              </MobileListItem>
            )}

            {job.customer_phone && (
              <MobileListItem
                leftContent={<span className="text-lg">📞</span>}
                subtitle="Customer Phone"
                onClick={handleCallCustomer}
                rightContent={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                }
              >
                {job.customer_phone}
              </MobileListItem>
            )}
          </div>
        </MobileCard>

        {/* Job Notes */}
        {(job.notes && job.notes.length > 0) && (
          <MobileCard>
            <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
            <div className="space-y-3">
              {job.notes.map((note, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-800 mb-2">{note.content}</p>
                  <div className="text-xs text-gray-500">
                    {note.created_by} • {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </MobileCard>
        )}

        {/* Add Note Input */}
        {showNotesInput && (
          <MobileCard>
            <h3 className="font-semibold text-gray-900 mb-3">Add Note</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your note here..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleAddNote}
                disabled={!notes.trim() || notesMutation.isLoading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {notesMutation.isLoading ? 'Saving...' : 'Save Note'}
              </button>
              <button
                onClick={() => {
                  setShowNotesInput(false);
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </MobileCard>
        )}

        {!isOnline && (
          <MobileCard className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className="font-medium text-yellow-800">Offline Mode</div>
                <div className="text-sm text-yellow-700">Changes will sync when online</div>
              </div>
            </div>
          </MobileCard>
        )}
      </div>

      {/* Status Actions FAB */}
      {job.status !== 'completed' && job.status !== 'cancelled' && (
        <MobileFAB
          onClick={() => setShowStatusActions(true)}
          position="bottom-right"
          variant="primary"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </MobileFAB>
      )}

      {/* Status Action Sheet */}
      <MobileActionSheet
        open={showStatusActions}
        onClose={() => setShowStatusActions(false)}
        title="Update Job Status"
      >
        <div className="space-y-2">
          {statusActions
            .filter(action => action.status !== job.status)
            .map((action) => (
              <button
                key={action.id}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={statusMutation.isLoading}
                className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors ${action.color}`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showNotesInput}
                onChange={(e) => setShowNotesInput(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Add note with status change</span>
            </label>
          </div>

          {showNotesInput && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter note (optional)..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none mt-2"
              rows={2}
            />
          )}
        </div>
      </MobileActionSheet>

      {/* More Actions Sheet */}
      <MobileActionSheet
        open={showMoreActions}
        onClose={() => setShowMoreActions(false)}
        title="Job Actions"
      >
        <div className="space-y-2">
          {moreActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.action();
                setShowMoreActions(false);
              }}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-lg">{action.icon}</span>
              <span className="font-medium text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>
      </MobileActionSheet>
    </div>
  );
};

export default JobDetailPage;