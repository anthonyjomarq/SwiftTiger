import React from 'react';
import { Dashboard, DashboardToolbar } from '../components/Dashboard';
import { USER_ROLES, INTERFACE_TYPES } from '../types/index.js';
import { Button } from '../components/Button';
import { useNotifications } from '../components/NotificationHub';

/**
 * Admin Dashboard Template
 * Complete dashboard implementation for administrators
 */

const AdminDashboard = ({ 
  user,
  apiRequest,
  onNavigate,
  customActions = [],
  className,
  ...props 
}) => {
  const { showSuccess } = useNotifications();

  const handleCustomAction = (action) => {
    switch (action) {
      case 'export':
        showSuccess('Export Started', 'Dashboard data export has been initiated.');
        break;
      case 'settings':
        onNavigate?.('/admin/settings');
        break;
      case 'users':
        onNavigate?.('/admin/users');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const headerContent = (
    <div className="flex items-center space-x-3">
      <DashboardToolbar />
      
      <div className="border-l border-st-border-primary pl-3 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCustomAction('export')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCustomAction('settings')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Button>
        
        {customActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={() => handleCustomAction(action.key)}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );

  const dashboardConfig = {
    title: `Welcome back, ${user?.name || 'Admin'}`,
    subtitle: 'System overview and management tools',
    refreshInterval: 30000,
    defaultWidgets: [
      {
        id: 'admin-stats',
        type: 'stats',
        title: 'System Overview',
        size: 'large',
        priority: 1,
        data: [
          { label: 'Total Users', key: 'totalUsers', icon: '👥', color: 'primary' },
          { label: 'Active Jobs', key: 'activeJobs', icon: '🔧', color: 'info' },
          { label: 'System Health', key: 'systemHealth', icon: '💚', color: 'success' },
          { label: 'Revenue Today', key: 'revenueToday', icon: '💰', color: 'accent', format: 'currency' },
        ],
        refreshable: true,
      },
      {
        id: 'system-health',
        type: 'system',
        title: 'System Health',
        subtitle: 'Server performance metrics',
        size: 'medium',
        priority: 2,
        refreshable: true,
      },
      {
        id: 'user-analytics',
        type: 'chart',
        title: 'User Analytics',
        subtitle: 'User activity and growth trends',
        size: 'medium',
        priority: 3,
        refreshable: true,
      },
      {
        id: 'recent-activity',
        type: 'activity',
        title: 'Recent Activity',
        subtitle: 'Latest system events and user actions',
        size: 'large',
        priority: 4,
        refreshable: true,
        data: [
          { message: 'New user registration: john.doe@example.com', timestamp: '2 minutes ago', type: 'info' },
          { message: 'Job #1234 completed successfully', timestamp: '5 minutes ago', type: 'success' },
          { message: 'System backup completed', timestamp: '10 minutes ago', type: 'success' },
          { message: 'High CPU usage detected on server-02', timestamp: '15 minutes ago', type: 'warning' },
          { message: 'New technician assigned: Sarah Smith', timestamp: '20 minutes ago', type: 'info' },
        ],
      },
      {
        id: 'job-analytics',
        type: 'progress',
        title: 'Job Analytics',
        subtitle: 'Current job distribution and completion rates',
        size: 'medium',
        priority: 5,
        data: [
          { label: 'Jobs Completed Today', value: 85, color: 'success' },
          { label: 'Customer Satisfaction', value: 92, color: 'primary' },
          { label: 'Team Efficiency', value: 78, color: 'info' },
          { label: 'Revenue Target', value: 64, color: 'accent' },
        ],
      },
      {
        id: 'top-technicians',
        type: 'table',
        title: 'Top Performing Technicians',
        subtitle: 'This month\'s performance leaders',
        size: 'large',
        priority: 6,
        data: {
          headers: ['Technician', 'Jobs Completed', 'Rating', 'Revenue'],
          rows: [
            ['John Doe', '45', '4.9', '$12,450'],
            ['Sarah Smith', '42', '4.8', '$11,800'],
            ['Mike Johnson', '38', '4.7', '$10,950'],
            ['Emily Davis', '35', '4.9', '$10,200'],
            ['Chris Wilson', '32', '4.6', '$9,800'],
          ],
        },
      },
      {
        id: 'quick-actions',
        type: 'list',
        title: 'Quick Actions',
        subtitle: 'Common administrative tasks',
        size: 'medium',
        priority: 7,
        data: [
          { label: 'Pending User Approvals', value: '3', action: () => onNavigate?.('/admin/users?filter=pending') },
          { label: 'System Alerts', value: '2', action: () => onNavigate?.('/admin/alerts') },
          { label: 'Backup Status', value: 'OK', action: () => onNavigate?.('/admin/backups') },
          { label: 'License Expiry', value: '45 days', action: () => onNavigate?.('/admin/license') },
        ],
      },
    ],
  };

  return (
    <Dashboard
      userRole={USER_ROLES.ADMIN}
      interfaceType={INTERFACE_TYPES.ADMIN}
      customConfig={dashboardConfig}
      headerContent={headerContent}
      showCustomization={true}
      className={className}
      {...props}
    />
  );
};

export default AdminDashboard;