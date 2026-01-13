import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/shared/contexts/WebSocketContext';

export const useRealTimeJobs = (jobId?: string) => {
  const queryClient = useQueryClient();
  const { notifications, joinJobRoom, leaveJobRoom } = useWebSocket();
  const lastProcessedRef = useRef<string>('');

  // Join/leave job room when jobId changes
  useEffect(() => {
    if (jobId) {
      joinJobRoom(jobId);
      return () => {
        leaveJobRoom(jobId);
      };
    }
  }, [jobId, joinJobRoom, leaveJobRoom]);

  // Process real-time notifications
  useEffect(() => {
    const latestNotification = notifications[0];
    if (!latestNotification) return;

    const notificationId = `${latestNotification.timestamp}-${latestNotification.type}`;
    if (lastProcessedRef.current === notificationId) return;
    
    lastProcessedRef.current = notificationId;

    switch (latestNotification.type) {
      case 'job_created':
        // Invalidate jobs list to show new job
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        break;

      case 'job_updated':
        const updatedJob = latestNotification.data;
        if (updatedJob?.id) {
          // Update specific job in cache
          queryClient.setQueryData(['jobs', updatedJob.id], updatedJob);
          
          // Invalidate jobs list to update filtered views
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
        break;

      case 'job_status_changed':
        const statusChangedJob = latestNotification.data;
        if (statusChangedJob?.id) {
          // Update job in cache
          queryClient.setQueryData(['jobs', statusChangedJob.id], statusChangedJob);
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['job-status-stats'] });
        }
        break;

      case 'job_log_created':
        const newJobLog = latestNotification.data;
        if (newJobLog?.jobId) {
          // Invalidate job logs for the specific job
          queryClient.invalidateQueries({ queryKey: ['job-logs', newJobLog.jobId] });
          
          // Update job details if it's currently viewed
          if (jobId === newJobLog.jobId) {
            queryClient.invalidateQueries({ queryKey: ['jobs', newJobLog.jobId] });
          }
        }
        break;

      case 'technician_location':
        const locationData = latestNotification.data;
        if (locationData?.technicianId) {
          // Update technician location data
          queryClient.setQueryData(
            ['technician-location', locationData.technicianId],
            locationData
          );
        }
        break;

      case 'dashboard_update':
        // Refresh all dashboard-related queries
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['job-status-stats'] });
        queryClient.invalidateQueries({ queryKey: ['technician-workload'] });
        queryClient.invalidateQueries({ queryKey: ['job-trends'] });
        break;

      case 'typing_indicator':
        // Handle typing indicators (could be used for job log comments)
        const typingData = latestNotification.data;
        if (typingData?.jobId && jobId === typingData.jobId) {
          // Update typing status in component state if needed
          queryClient.setQueryData(
            ['typing-indicator', typingData.jobId],
            {
              userId: typingData.userId,
              userName: typingData.userName,
              isTyping: typingData.isTyping,
              timestamp: new Date()
            }
          );
        }
        break;

      default:
        console.log('Unhandled notification type:', latestNotification.type);
    }
  }, [notifications, queryClient, jobId]);

  return {
    notifications,
    joinJobRoom,
    leaveJobRoom
  };
};

export default useRealTimeJobs;