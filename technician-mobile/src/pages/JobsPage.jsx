import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard, MobileListItem, MobilePullToRefresh } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';

// Services
import { jobsApi } from '../services/api';

const JobsPage = () => {
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { isOnline, syncPendingData } = useOffline();
  const { showSuccess, showError } = useNotifications();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch jobs
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['jobs', user?.id, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await apiRequest(`/jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      throw new Error('Failed to fetch jobs');
    },
    enabled: !!user && isOnline,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [jobs, searchTerm]);

  // Group jobs by status
  const groupedJobs = useMemo(() => {
    const groups = {
      in_progress: [],
      pending: [],
      completed: [],
      on_hold: [],
    };

    filteredJobs.forEach(job => {
      if (groups[job.status]) {
        groups[job.status].push(job);
      }
    });

    return groups;
  }, [filteredJobs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isOnline) {
        await Promise.all([refetch(), syncPendingData()]);
        showSuccess('Updated', 'Jobs list refreshed');
      } else {
        showError('Offline', 'Cannot refresh while offline');
      }
    } catch (error) {
      showError('Error', 'Failed to refresh jobs');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleJobClick = (job) => {
    navigate(`/jobs/${job.id}`);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: '⏳',
        label: 'Pending'
      },
      in_progress: {
        color: 'bg-blue-100 text-blue-800',
        icon: '🔧',
        label: 'In Progress'
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        icon: '✅',
        label: 'Completed'
      },
      on_hold: {
        color: 'bg-gray-100 text-gray-800',
        icon: '⏸️',
        label: 'On Hold'
      },
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusFilters = [
    { value: 'all', label: 'All Jobs', count: jobs.length },
    { value: 'in_progress', label: 'In Progress', count: groupedJobs.in_progress.length },
    { value: 'pending', label: 'Pending', count: groupedJobs.pending.length },
    { value: 'completed', label: 'Completed', count: groupedJobs.completed.length },
  ];

  const JobGroup = ({ title, jobs, icon }) => {
    if (jobs.length === 0) return null;

    return (
      <MobileCard className="mb-4">
        <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-100">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {jobs.length}
          </span>
        </div>
        <div className="space-y-0">
          {jobs.map((job, index) => (
            <MobileListItem
              key={job.id}
              onClick={() => handleJobClick(job)}
              divider={index < jobs.length - 1}
              leftContent={
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    #{job.id}
                  </span>
                </div>
              }
              rightContent={
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusConfig(job.status).color}`}>
                    {getStatusConfig(job.status).label}
                  </div>
                  {job.priority !== 'normal' && (
                    <div className={`text-xs mt-1 ${getPriorityColor(job.priority)}`}>
                      {job.priority.toUpperCase()}
                    </div>
                  )}
                </div>
              }
              subtitle={
                <div className="space-y-1">
                  <div className="text-gray-600">{job.customer_name}</div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {job.scheduled_date && (
                      <span>📅 {formatDate(job.scheduled_date)}</span>
                    )}
                    {job.scheduled_time && (
                      <span>🕐 {formatTime(job.scheduled_time)}</span>
                    )}
                    {job.estimated_duration && (
                      <span>⏱️ {job.estimated_duration}min</span>
                    )}
                  </div>
                </div>
              }
            >
              {job.title}
            </MobileListItem>
          ))}
        </div>
      </MobileCard>
    );
  };

  return (
    <div className="jobs-page">
      <MobileHeader
        title="My Jobs"
        subtitle={`${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''}`}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showNotifications={true}
      />

      <div className="p-4">
        {/* Status Filters */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-50 rounded text-xs">
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <MobilePullToRefresh onRefresh={handleRefresh} refreshing={isRefreshing}>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <MobileCard key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </MobileCard>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <MobileCard className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Matching Jobs' : 'No Jobs Yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No jobs found matching "${searchTerm}"`
                  : 'Your assigned jobs will appear here'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear Search
                </button>
              )}
            </MobileCard>
          ) : statusFilter === 'all' ? (
            // Show grouped jobs when viewing all
            <div>
              <JobGroup
                title="In Progress"
                jobs={groupedJobs.in_progress}
                icon="🔧"
              />
              <JobGroup
                title="Pending"
                jobs={groupedJobs.pending}
                icon="⏳"
              />
              <JobGroup
                title="Completed"
                jobs={groupedJobs.completed}
                icon="✅"
              />
              <JobGroup
                title="On Hold"
                jobs={groupedJobs.on_hold}
                icon="⏸️"
              />
            </div>
          ) : (
            // Show flat list when filtering by status
            <MobileCard>
              <div className="space-y-0">
                {filteredJobs.map((job, index) => (
                  <MobileListItem
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    divider={index < filteredJobs.length - 1}
                    leftContent={
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          #{job.id}
                        </span>
                      </div>
                    }
                    rightContent={
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusConfig(job.status).color}`}>
                          {getStatusConfig(job.status).label}
                        </div>
                        {job.priority !== 'normal' && (
                          <div className={`text-xs mt-1 ${getPriorityColor(job.priority)}`}>
                            {job.priority.toUpperCase()}
                          </div>
                        )}
                      </div>
                    }
                    subtitle={
                      <div className="space-y-1">
                        <div className="text-gray-600">{job.customer_name}</div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {job.scheduled_date && (
                            <span>📅 {formatDate(job.scheduled_date)}</span>
                          )}
                          {job.scheduled_time && (
                            <span>🕐 {formatTime(job.scheduled_time)}</span>
                          )}
                        </div>
                      </div>
                    }
                  >
                    {job.title}
                  </MobileListItem>
                ))}
              </div>
            </MobileCard>
          )}

          {!isOnline && (
            <MobileCard className="bg-yellow-50 border-yellow-200 mt-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium text-yellow-800">Offline Mode</div>
                  <div className="text-sm text-yellow-700">Showing cached jobs</div>
                </div>
              </div>
            </MobileCard>
          )}
        </MobilePullToRefresh>
      </div>
    </div>
  );
};

export default JobsPage;