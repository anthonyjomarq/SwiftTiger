import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AdminContext = createContext({});

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { apiRequest, isAuthenticated } = useAuth();
  
  // Global stats and data
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalTechnicians: 0,
    totalCustomers: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    fuelCosts: 0,
    routeEfficiency: 0,
  });

  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.9%',
    responseTime: '150ms',
    activeUsers: 0,
    errors: 0,
    lastUpdate: new Date(),
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data on load and periodically
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchSystemHealth();
      fetchRecentActivity();
      
      // Set up periodic updates
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchSystemHealth();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await apiRequest('/admin/system/health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth({
          ...data.data,
          lastUpdate: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      setSystemHealth(prev => ({
        ...prev,
        status: 'error',
        lastUpdate: new Date(),
      }));
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await apiRequest('/admin/activity/recent?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiRequest('/admin/notifications?unread=true');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Helper functions for data formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      maintenance: 'text-blue-600',
    };
    return colors[status] || colors.error;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      maintenance: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || colors.error;
  };

  // Quick actions
  const refreshDashboard = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchSystemHealth(),
      fetchRecentActivity(),
    ]);
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await apiRequest(`/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true } 
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  // Calculate derived stats
  const getDerivedStats = () => {
    const jobCompletionRate = dashboardStats.totalJobs > 0 
      ? (dashboardStats.completedJobs / dashboardStats.totalJobs) * 100 
      : 0;

    const revenueGrowth = dashboardStats.monthlyRevenue > 0 && dashboardStats.totalRevenue > dashboardStats.monthlyRevenue
      ? ((dashboardStats.monthlyRevenue / (dashboardStats.totalRevenue - dashboardStats.monthlyRevenue)) * 100)
      : 0;

    return {
      jobCompletionRate,
      revenueGrowth,
      averageRevenuePerJob: dashboardStats.completedJobs > 0 
        ? dashboardStats.totalRevenue / dashboardStats.completedJobs 
        : 0,
      technicianUtilization: dashboardStats.totalTechnicians > 0 
        ? (dashboardStats.activeJobs / dashboardStats.totalTechnicians) 
        : 0,
    };
  };

  const value = {
    // Data
    dashboardStats,
    systemHealth,
    recentActivity,
    notifications,
    loading,
    
    // Actions
    refreshDashboard,
    fetchNotifications,
    markNotificationRead,
    addNotification,
    
    // Utilities
    formatCurrency,
    formatNumber,
    formatPercentage,
    getStatusColor,
    getStatusBadgeColor,
    getDerivedStats,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};