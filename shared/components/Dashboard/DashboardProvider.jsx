import React, { createContext, useContext, useState, useEffect } from 'react';
import { useResponsiveContext } from '../ResponsiveProvider';
import { USER_ROLES, INTERFACE_TYPES } from '../../types/index.js';

/**
 * Unified Dashboard Provider
 * Manages dashboard state and configuration across all user types
 */

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ 
  children, 
  userRole, 
  interfaceType,
  customConfig = {} 
}) => {
  const { responsive } = useResponsiveContext();
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDashboard();
  }, [userRole, interfaceType, responsive.deviceType]);

  const initializeDashboard = () => {
    const config = generateDashboardConfig(userRole, interfaceType, responsive);
    setDashboardConfig(config);
    setWidgets(config.defaultWidgets);
    setLayout(config.defaultLayout);
    setIsLoading(false);
  };

  const generateDashboardConfig = (role, type, responsive) => {
    const baseConfig = {
      title: getDashboardTitle(role),
      subtitle: getDashboardSubtitle(role),
      layout: responsive.isMobile ? 'stack' : 'grid',
      columns: responsive.isMobile ? 1 : getColumnCount(role, type),
      spacing: responsive.isMobile ? 'tight' : 'normal',
      showHeader: true,
      showNavigation: true,
      showNotifications: true,
      refreshInterval: getRefreshInterval(role),
      ...customConfig
    };

    return {
      ...baseConfig,
      defaultWidgets: getDefaultWidgets(role, type, responsive),
      availableWidgets: getAvailableWidgets(role, type),
      defaultLayout: baseConfig.layout,
    };
  };

  const getDashboardTitle = (role) => {
    const titles = {
      [USER_ROLES.ADMIN]: 'Admin Dashboard',
      [USER_ROLES.MANAGER]: 'Manager Dashboard', 
      [USER_ROLES.DISPATCHER]: 'Dispatch Center',
      [USER_ROLES.TECHNICIAN]: 'My Jobs',
      [USER_ROLES.CUSTOMER]: 'My Account',
    };
    return titles[role] || 'Dashboard';
  };

  const getDashboardSubtitle = (role) => {
    const subtitles = {
      [USER_ROLES.ADMIN]: 'System overview and management',
      [USER_ROLES.MANAGER]: 'Team performance and analytics',
      [USER_ROLES.DISPATCHER]: 'Job assignments and scheduling',
      [USER_ROLES.TECHNICIAN]: 'Your assigned jobs and tasks',
      [USER_ROLES.CUSTOMER]: 'Service requests and history',
    };
    return subtitles[role] || '';
  };

  const getColumnCount = (role, type) => {
    if (type === INTERFACE_TYPES.MOBILE) return 1;
    
    const columnCounts = {
      [USER_ROLES.ADMIN]: 4,
      [USER_ROLES.MANAGER]: 3,
      [USER_ROLES.DISPATCHER]: 3,
      [USER_ROLES.TECHNICIAN]: 2,
      [USER_ROLES.CUSTOMER]: 2,
    };
    return columnCounts[role] || 3;
  };

  const getRefreshInterval = (role) => {
    const intervals = {
      [USER_ROLES.ADMIN]: 30000, // 30 seconds
      [USER_ROLES.MANAGER]: 60000, // 1 minute
      [USER_ROLES.DISPATCHER]: 15000, // 15 seconds
      [USER_ROLES.TECHNICIAN]: 30000, // 30 seconds
      [USER_ROLES.CUSTOMER]: 300000, // 5 minutes
    };
    return intervals[role] || 60000;
  };

  const getDefaultWidgets = (role, type, responsive) => {
    const widgets = [];

    // Common widgets for all roles
    widgets.push({
      id: 'stats-overview',
      type: 'stats',
      title: 'Overview',
      size: responsive.isMobile ? 'full' : 'large',
      priority: 1,
      data: getStatsConfig(role),
    });

    // Role-specific widgets
    switch (role) {
      case USER_ROLES.ADMIN:
        widgets.push(
          {
            id: 'system-health',
            type: 'system',
            title: 'System Health',
            size: 'medium',
            priority: 2,
          },
          {
            id: 'recent-activity',
            type: 'activity',
            title: 'Recent Activity',
            size: 'large',
            priority: 3,
          },
          {
            id: 'user-analytics',
            type: 'analytics',
            title: 'User Analytics',
            size: 'medium',
            priority: 4,
          }
        );
        break;

      case USER_ROLES.MANAGER:
        widgets.push(
          {
            id: 'team-performance',
            type: 'performance',
            title: 'Team Performance',
            size: 'large',
            priority: 2,
          },
          {
            id: 'revenue-chart',
            type: 'chart',
            title: 'Revenue Trends',
            size: 'medium',
            priority: 3,
          }
        );
        break;

      case USER_ROLES.DISPATCHER:
        widgets.push(
          {
            id: 'job-queue',
            type: 'queue',
            title: 'Job Queue',
            size: 'large',
            priority: 2,
          },
          {
            id: 'technician-status',
            type: 'status',
            title: 'Technician Status',
            size: 'medium',
            priority: 3,
          },
          {
            id: 'map-view',
            type: 'map',
            title: 'Live Map',
            size: 'large',
            priority: 4,
          }
        );
        break;

      case USER_ROLES.TECHNICIAN:
        widgets.push(
          {
            id: 'assigned-jobs',
            type: 'jobs',
            title: 'My Jobs',
            size: 'large',
            priority: 2,
          },
          {
            id: 'schedule',
            type: 'schedule',
            title: 'Today\'s Schedule',
            size: 'medium',
            priority: 3,
          }
        );
        break;

      case USER_ROLES.CUSTOMER:
        widgets.push(
          {
            id: 'active-requests',
            type: 'requests',
            title: 'Active Requests',
            size: 'large',
            priority: 2,
          },
          {
            id: 'service-history',
            type: 'history',
            title: 'Service History',
            size: 'medium',
            priority: 3,
          }
        );
        break;
    }

    return widgets.sort((a, b) => a.priority - b.priority);
  };

  const getAvailableWidgets = (role, type) => {
    // Define all possible widgets for each role
    const allWidgets = {
      [USER_ROLES.ADMIN]: [
        'stats-overview', 'system-health', 'recent-activity', 'user-analytics',
        'job-analytics', 'revenue-chart', 'performance-metrics', 'alerts'
      ],
      [USER_ROLES.MANAGER]: [
        'stats-overview', 'team-performance', 'revenue-chart', 'job-analytics',
        'customer-satisfaction', 'resource-utilization'
      ],
      [USER_ROLES.DISPATCHER]: [
        'stats-overview', 'job-queue', 'technician-status', 'map-view',
        'scheduling-board', 'urgent-jobs'
      ],
      [USER_ROLES.TECHNICIAN]: [
        'stats-overview', 'assigned-jobs', 'schedule', 'route-optimization',
        'time-tracking', 'notes'
      ],
      [USER_ROLES.CUSTOMER]: [
        'stats-overview', 'active-requests', 'service-history', 'account-info',
        'support-tickets', 'billing'
      ],
    };

    return allWidgets[role] || [];
  };

  const getStatsConfig = (role) => {
    const configs = {
      [USER_ROLES.ADMIN]: [
        { label: 'Total Users', key: 'totalUsers', icon: '👥', color: 'primary' },
        { label: 'Active Jobs', key: 'activeJobs', icon: '🔧', color: 'info' },
        { label: 'Revenue', key: 'revenue', icon: '💰', color: 'success', format: 'currency' },
        { label: 'System Load', key: 'systemLoad', icon: '⚡', color: 'warning', format: 'percentage' },
      ],
      [USER_ROLES.MANAGER]: [
        { label: 'Team Size', key: 'teamSize', icon: '👥', color: 'primary' },
        { label: 'Jobs Today', key: 'jobsToday', icon: '📋', color: 'info' },
        { label: 'Revenue', key: 'revenue', icon: '💰', color: 'success', format: 'currency' },
        { label: 'Efficiency', key: 'efficiency', icon: '📈', color: 'accent', format: 'percentage' },
      ],
      [USER_ROLES.DISPATCHER]: [
        { label: 'Pending Jobs', key: 'pendingJobs', icon: '⏳', color: 'warning' },
        { label: 'In Progress', key: 'inProgressJobs', icon: '🔧', color: 'info' },
        { label: 'Completed Today', key: 'completedToday', icon: '✅', color: 'success' },
        { label: 'Available Techs', key: 'availableTechs', icon: '👷', color: 'primary' },
      ],
      [USER_ROLES.TECHNICIAN]: [
        { label: 'Jobs Today', key: 'jobsToday', icon: '📋', color: 'primary' },
        { label: 'Completed', key: 'completed', icon: '✅', color: 'success' },
        { label: 'Hours Worked', key: 'hoursWorked', icon: '⏰', color: 'info' },
        { label: 'Efficiency', key: 'efficiency', icon: '📈', color: 'accent', format: 'percentage' },
      ],
      [USER_ROLES.CUSTOMER]: [
        { label: 'Active Requests', key: 'activeRequests', icon: '🔧', color: 'primary' },
        { label: 'Completed Jobs', key: 'completedJobs', icon: '✅', color: 'success' },
        { label: 'Total Spent', key: 'totalSpent', icon: '💰', color: 'info', format: 'currency' },
        { label: 'Satisfaction', key: 'satisfaction', icon: '⭐', color: 'accent', format: 'rating' },
      ],
    };

    return configs[role] || [];
  };

  // Widget management functions
  const addWidget = (widgetConfig) => {
    setWidgets(prev => [...prev, { ...widgetConfig, id: `widget-${Date.now()}` }]);
  };

  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const updateWidget = (widgetId, updates) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ));
  };

  const reorderWidgets = (newOrder) => {
    setWidgets(newOrder);
  };

  const resetToDefault = () => {
    const config = generateDashboardConfig(userRole, interfaceType, responsive);
    setWidgets(config.defaultWidgets);
    setLayout(config.defaultLayout);
  };

  // Layout management
  const changeLayout = (newLayout) => {
    setLayout(newLayout);
  };

  const value = {
    // Configuration
    dashboardConfig,
    userRole,
    interfaceType,
    isLoading,

    // Widgets
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,

    // Layout
    layout,
    changeLayout,

    // Utilities
    resetToDefault,
    
    // Data fetching helpers
    refreshInterval: dashboardConfig?.refreshInterval,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardProvider;