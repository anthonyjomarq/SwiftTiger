import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard, MobileFAB, MobilePullToRefresh } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useOffline } from '../contexts/OfflineContext';

// Services
import { jobsApi, dashboardApi } from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { currentLocation, isTracking, startTracking, stopTracking } = useLocation();
  const { isOnline, syncPendingData } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      const response = await apiRequest('/dashboard');
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      throw new Error('Failed to fetch dashboard data');
    },
    enabled: !!user && isOnline,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch today's jobs
  const { data: todaysJobs } = useQuery({
    queryKey: ['jobs', 'today', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiRequest(`/jobs?date=${today}&status=pending,in_progress`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    },
    enabled: !!user && isOnline,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isOnline) {
        await Promise.all([refetch(), syncPendingData()]);
        showSuccess('Updated', 'Dashboard data refreshed');
      } else {
        showInfo('Offline', 'Cannot refresh while offline');
      }
    } catch (error) {
      showError('Error', 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClockInOut = () => {
    // TODO: Implement time tracking
    showInfo('Coming Soon', 'Time tracking feature will be available soon');
  };

  const handleStartNextJob = () => {
    const nextJob = todaysJobs?.find(job => job.status === 'pending');
    if (nextJob) {
      navigate(`/jobs/${nextJob.id}`);
    } else {
      showInfo('No Jobs', 'No pending jobs to start');
    }
  };

  const handleEmergency = () => {
    navigate('/emergency');
  };

  const handleLocationToggle = () => {
    if (isTracking) {
      stopTracking();
      showInfo('Location', 'Location tracking stopped');
    } else {
      startTracking();
      showInfo('Location', 'Location tracking started');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const firstName = user?.name?.split(' ')[0] || 'Technician';
    
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  const getCurrentJob = () => {
    return todaysJobs?.find(job => job.status === 'in_progress');
  };

  const getUpcomingJobs = () => {
    return todaysJobs?.filter(job => job.status === 'pending').slice(0, 3) || [];
  };

  return (
    <div className="dashboard-page">
      <MobileHeader
        title={getGreeting()}
        subtitle={`${formatTime(currentTime)} • ${isOnline ? 'Online' : 'Offline'}`}
        showNotifications={true}
        rightAction={
          <button
            onClick={handleLocationToggle}
            className={`p-2 rounded-lg transition-colors ${
              isTracking 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        }
      />

      <MobilePullToRefresh onRefresh={handleRefresh} refreshing={isRefreshing}>
        <div className="p-4 space-y-4">
          {/* Current Job Card */}
          {getCurrentJob() && (
            <MobileCard
              variant="elevated"
              onClick={() => navigate(`/jobs/${getCurrentJob().id}`)}
              className="border-l-4 border-l-blue-500"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">CURRENT JOB</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  In Progress
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {getCurrentJob().title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {getCurrentJob().customer_name}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Started at {formatTime(new Date(getCurrentJob().started_at || Date.now()))}
              </div>
            </MobileCard>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <MobileCard className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {todaysJobs?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Jobs Today</div>
            </MobileCard>
            
            <MobileCard className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {todaysJobs?.filter(job => job.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </MobileCard>
          </div>

          {/* Quick Actions */}
          <MobileCard>
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleClockInOut}
                className="p-3 bg-blue-50 rounded-lg flex flex-col items-center space-y-1 transition-colors hover:bg-blue-100"
              >
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-700">Clock In</span>
              </button>
              
              <button
                onClick={handleStartNextJob}
                className="p-3 bg-green-50 rounded-lg flex flex-col items-center space-y-1 transition-colors hover:bg-green-100"
              >
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-green-700">Start Job</span>
              </button>
              
              <button
                onClick={() => navigate('/camera')}
                className="p-3 bg-purple-50 rounded-lg flex flex-col items-center space-y-1 transition-colors hover:bg-purple-100"
              >
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-purple-700">Photo</span>
              </button>
              
              <button
                onClick={handleEmergency}
                className="p-3 bg-red-50 rounded-lg flex flex-col items-center space-y-1 transition-colors hover:bg-red-100"
              >
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-red-700">Emergency</span>
              </button>
            </div>
          </MobileCard>

          {/* Upcoming Jobs */}
          {getUpcomingJobs().length > 0 && (
            <MobileCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Upcoming Jobs</h3>
                <button
                  onClick={() => navigate('/jobs')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {getUpcomingJobs().map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {job.title}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {job.customer_name}
                      </div>
                      {job.scheduled_time && (
                        <div className="text-xs text-gray-500">
                          {job.scheduled_time}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
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
                  <div className="text-sm text-yellow-700">Some features may be limited</div>
                </div>
              </div>
            </MobileCard>
          )}
        </div>
      </MobilePullToRefresh>

      {/* Floating Action Button */}
      <MobileFAB
        onClick={handleStartNextJob}
        position="bottom-right"
        variant="primary"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </MobileFAB>
    </div>
  );
};

export default DashboardPage;