/**
 * Dashboard Data Hook
 * Unified data fetching for dashboard widgets across all user types
 */

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, USER_ROLES } from '../types/index.js';

export const useDashboardData = (userRole, apiRequest) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    charts: {},
    lists: {},
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data based on user role
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const endpoints = getDashboardEndpoints(userRole);
      const requests = endpoints.map(endpoint => 
        apiRequest(endpoint.url).then(response => ({
          key: endpoint.key,
          data: response.ok ? response.json() : null,
          error: response.ok ? null : response.statusText,
        }))
      );

      const results = await Promise.allSettled(requests);
      
      const newData = {
        stats: {},
        charts: {},
        lists: {},
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const { key, data } = result.value;
          newData[key] = data.data || data;
        }
      });

      setDashboardData(newData);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    } finally {
      setRefreshing(false);
    }
  }, [userRole, apiRequest]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto refresh based on user role
  useEffect(() => {
    const interval = getRefreshInterval(userRole);
    if (interval > 0) {
      const timer = setInterval(fetchDashboardData, interval);
      return () => clearInterval(timer);
    }
  }, [fetchDashboardData, userRole]);

  const refresh = () => {
    fetchDashboardData();
  };

  return {
    ...dashboardData,
    refresh,
    refreshing,
  };
};

// Get dashboard endpoints based on user role
const getDashboardEndpoints = (userRole) => {
  const baseEndpoints = [
    { key: 'stats', url: API_ENDPOINTS.DASHBOARD.STATS },
  ];

  const roleSpecificEndpoints = {
    [USER_ROLES.ADMIN]: [
      { key: 'systemHealth', url: '/api/admin/system-health' },
      { key: 'userAnalytics', url: '/api/admin/user-analytics' },
      { key: 'recentActivity', url: '/api/admin/recent-activity' },
    ],
    [USER_ROLES.MANAGER]: [
      { key: 'teamPerformance', url: '/api/manager/team-performance' },
      { key: 'revenueChart', url: '/api/manager/revenue-chart' },
      { key: 'jobAnalytics', url: '/api/manager/job-analytics' },
    ],
    [USER_ROLES.DISPATCHER]: [
      { key: 'jobQueue', url: '/api/dispatcher/job-queue' },
      { key: 'technicianStatus', url: '/api/dispatcher/technician-status' },
      { key: 'mapData', url: API_ENDPOINTS.JOBS.MAP_DATA },
    ],
    [USER_ROLES.TECHNICIAN]: [
      { key: 'assignedJobs', url: '/api/technician/assigned-jobs' },
      { key: 'schedule', url: '/api/technician/schedule' },
      { key: 'timeTracking', url: '/api/technician/time-tracking' },
    ],
    [USER_ROLES.CUSTOMER]: [
      { key: 'activeRequests', url: '/api/customer/active-requests' },
      { key: 'serviceHistory', url: '/api/customer/service-history' },
      { key: 'accountInfo', url: '/api/customer/account-info' },
    ],
  };

  return [
    ...baseEndpoints,
    ...(roleSpecificEndpoints[userRole] || []),
  ];
};

// Get refresh interval based on user role
const getRefreshInterval = (userRole) => {
  const intervals = {
    [USER_ROLES.ADMIN]: 30000, // 30 seconds
    [USER_ROLES.MANAGER]: 60000, // 1 minute
    [USER_ROLES.DISPATCHER]: 15000, // 15 seconds - most frequent for real-time dispatch
    [USER_ROLES.TECHNICIAN]: 30000, // 30 seconds
    [USER_ROLES.CUSTOMER]: 300000, // 5 minutes - least frequent
  };
  
  return intervals[userRole] || 60000;
};

// Hook for specific widget data
export const useWidgetData = (widgetType, config, apiRequest) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = getWidgetEndpoint(widgetType, config);
      if (!endpoint) {
        setData(getStaticWidgetData(widgetType, config));
        setLoading(false);
        return;
      }

      const response = await apiRequest(endpoint);
      if (response.ok) {
        const result = await response.json();
        setData(result.data || result);
      } else {
        throw new Error(`Failed to fetch ${widgetType} data`);
      }
    } catch (err) {
      setError(err.message);
      setData(getStaticWidgetData(widgetType, config));
    } finally {
      setLoading(false);
    }
  }, [widgetType, config, apiRequest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
};

// Get API endpoint for specific widget type
const getWidgetEndpoint = (widgetType, config) => {
  const endpoints = {
    stats: API_ENDPOINTS.DASHBOARD.STATS,
    activity: API_ENDPOINTS.DASHBOARD.ACTIVITY,
    jobs: API_ENDPOINTS.JOBS.LIST,
    users: API_ENDPOINTS.USERS.LIST,
    customers: API_ENDPOINTS.CUSTOMERS.LIST,
    notifications: API_ENDPOINTS.NOTIFICATIONS.LIST,
    systemHealth: '/api/admin/system-health',
    teamPerformance: '/api/manager/team-performance',
    jobQueue: '/api/dispatcher/job-queue',
    technicianStatus: '/api/dispatcher/technician-status',
    assignedJobs: '/api/technician/assigned-jobs',
    schedule: '/api/technician/schedule',
    activeRequests: '/api/customer/active-requests',
    serviceHistory: '/api/customer/service-history',
  };

  return endpoints[widgetType];
};

// Get static/mock data for widgets (fallback)
const getStaticWidgetData = (widgetType, config) => {
  const staticData = {
    stats: [
      { label: 'Active Jobs', value: 12, icon: '🔧', color: 'info' },
      { label: 'Completed', value: 45, icon: '✅', color: 'success' },
      { label: 'Pending', value: 8, icon: '⏳', color: 'warning' },
      { label: 'Revenue', value: 15750, icon: '💰', color: 'primary', format: 'currency' },
    ],
    
    activity: [
      { message: 'Job #1234 completed by John Doe', timestamp: '2 minutes ago', type: 'success' },
      { message: 'New job request from ABC Corp', timestamp: '5 minutes ago', type: 'info' },
      { message: 'Technician Sarah assigned to Job #1235', timestamp: '10 minutes ago', type: 'info' },
      { message: 'Payment received for Job #1230', timestamp: '15 minutes ago', type: 'success' },
    ],
    
    list: [
      { label: 'High Priority Jobs', value: '3' },
      { label: 'Available Technicians', value: '8' },
      { label: 'Pending Approvals', value: '2' },
      { label: 'Overdue Jobs', value: '1' },
    ],
    
    progress: [
      { label: 'Jobs Completed', value: 75, color: 'success' },
      { label: 'Customer Satisfaction', value: 92, color: 'primary' },
      { label: 'Team Efficiency', value: 68, color: 'info' },
    ],
    
    system: {
      uptime: '99.9%',
      load: '2.1',
      cpu: 45,
      memory: 62,
    },
    
    table: {
      headers: ['Job ID', 'Customer', 'Status', 'Technician'],
      rows: [
        ['#1234', 'ABC Corp', 'In Progress', 'John Doe'],
        ['#1235', 'XYZ Ltd', 'Pending', 'Sarah Smith'],
        ['#1236', 'Tech Co', 'Completed', 'Mike Johnson'],
      ],
    },
    
    metric: {
      value: 42,
      label: 'Active Jobs',
      color: 'primary',
      change: 12,
    },
  };

  return staticData[widgetType] || null;
};

// Hook for dashboard customization
export const useDashboardCustomization = (userRole, initialConfig = {}) => {
  const [customization, setCustomization] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem(`dashboard-${userRole}`);
    return saved ? JSON.parse(saved) : initialConfig;
  });

  const updateCustomization = useCallback((updates) => {
    setCustomization(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(`dashboard-${userRole}`, JSON.stringify(newConfig));
      return newConfig;
    });
  }, [userRole]);

  const resetCustomization = useCallback(() => {
    localStorage.removeItem(`dashboard-${userRole}`);
    setCustomization(initialConfig);
  }, [userRole, initialConfig]);

  return {
    customization,
    updateCustomization,
    resetCustomization,
  };
};

export default useDashboardData;