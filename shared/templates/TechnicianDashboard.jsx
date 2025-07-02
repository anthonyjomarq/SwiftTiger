import React from 'react';
import { Dashboard, DashboardToolbar } from '../components/Dashboard';
import { USER_ROLES, INTERFACE_TYPES } from '../types/index.js';
import { Button } from '../components/Button';
import { useNotifications } from '../components/NotificationHub';
import { useResponsiveContext } from '../components/ResponsiveProvider';

/**
 * Technician Dashboard Template
 * Mobile-optimized dashboard for field technicians
 */

const TechnicianDashboard = ({ 
  user,
  apiRequest,
  onNavigate,
  currentLocation,
  className,
  ...props 
}) => {
  const { showSuccess, showInfo } = useNotifications();
  const { responsive } = useResponsiveContext();

  const handleQuickAction = (action) => {
    switch (action) {
      case 'clock-in':
        showSuccess('Clocked In', 'Your work day has started. Have a great day!');
        break;
      case 'clock-out':
        showSuccess('Clocked Out', 'Your work day is complete. Great job today!');
        break;
      case 'location':
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(() => {
            showInfo('Location Updated', 'Your current location has been shared with dispatch.');
          });
        }
        break;
      case 'emergency':
        showInfo('Emergency Alert', 'Emergency alert sent to dispatch. Help is on the way.');
        break;
      default:
        onNavigate?.(action);
    }
  };

  const headerContent = responsive.isMobile ? (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleQuickAction('location')}
        className="p-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Button>
      
      <Button
        variant="primary"
        size="sm"
        onClick={() => handleQuickAction('clock-in')}
      >
        Clock In
      </Button>
    </div>
  ) : (
    <div className="flex items-center space-x-3">
      <DashboardToolbar />
      
      <div className="border-l border-st-border-primary pl-3 flex items-center space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleQuickAction('clock-in')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Clock In
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAction('location')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Update Location
        </Button>
      </div>
    </div>
  );

  const dashboardConfig = {
    title: `Good morning, ${user?.name?.split(' ')[0] || 'Technician'}`,
    subtitle: 'Your jobs and schedule for today',
    refreshInterval: 30000,
    defaultLayout: responsive.isMobile ? 'stack' : 'grid',
    defaultWidgets: [
      {
        id: 'tech-stats',
        type: 'stats',
        title: 'Today\'s Overview',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 1,
        data: [
          { label: 'Jobs Today', key: 'jobsToday', icon: '📋', color: 'primary' },
          { label: 'Completed', key: 'completed', icon: '✅', color: 'success' },
          { label: 'Hours Worked', key: 'hoursWorked', icon: '⏰', color: 'info' },
          { label: 'Efficiency', key: 'efficiency', icon: '📈', color: 'accent', format: 'percentage' },
        ],
        refreshable: true,
      },
      {
        id: 'current-job',
        type: 'metric',
        title: 'Current Job',
        subtitle: 'Active assignment',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 2,
        data: {
          value: '#1234',
          label: 'ABC Corp - HVAC Repair',
          color: 'primary',
          action: () => onNavigate?.('/jobs/1234'),
        },
      },
      {
        id: 'assigned-jobs',
        type: 'list',
        title: 'Today\'s Jobs',
        subtitle: 'Your scheduled assignments',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 3,
        refreshable: true,
        data: [
          { 
            label: '9:00 AM - ABC Corp', 
            value: 'HVAC Repair', 
            status: 'current',
            action: () => onNavigate?.('/jobs/1234') 
          },
          { 
            label: '11:30 AM - XYZ Ltd', 
            value: 'Electrical Check', 
            status: 'upcoming',
            action: () => onNavigate?.('/jobs/1235') 
          },
          { 
            label: '2:00 PM - Tech Industries', 
            value: 'Maintenance', 
            status: 'upcoming',
            action: () => onNavigate?.('/jobs/1236') 
          },
          { 
            label: '4:30 PM - Office Complex', 
            value: 'Emergency Repair', 
            status: 'urgent',
            action: () => onNavigate?.('/jobs/1237') 
          },
        ],
      },
      {
        id: 'schedule',
        type: 'calendar',
        title: 'This Week',
        subtitle: 'Weekly schedule overview',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 4,
      },
      {
        id: 'time-tracking',
        type: 'progress',
        title: 'Time Tracking',
        subtitle: 'Daily progress',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 5,
        data: [
          { label: 'Hours Worked', value: 65, color: 'info' },
          { label: 'Break Time', value: 15, color: 'warning' },
          { label: 'Travel Time', value: 20, color: 'accent' },
        ],
      },
      {
        id: 'quick-actions',
        type: 'list',
        title: 'Quick Actions',
        subtitle: 'Common tasks',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 6,
        data: [
          { 
            label: 'Start Next Job', 
            value: 'XYZ Ltd', 
            action: () => onNavigate?.('/jobs/1235/start') 
          },
          { 
            label: 'Submit Time Sheet', 
            value: 'Weekly', 
            action: () => onNavigate?.('/timesheet') 
          },
          { 
            label: 'Request Parts', 
            value: 'Inventory', 
            action: () => onNavigate?.('/parts-request') 
          },
          { 
            label: 'Emergency Alert', 
            value: 'SOS', 
            action: () => handleQuickAction('emergency') 
          },
        ],
      },
      {
        id: 'recent-notes',
        type: 'activity',
        title: 'Recent Notes',
        subtitle: 'Job updates and communications',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 7,
        data: [
          { message: 'Completed HVAC inspection at ABC Corp', timestamp: '10 minutes ago', type: 'success' },
          { message: 'Requested additional parts for XYZ repair', timestamp: '1 hour ago', type: 'info' },
          { message: 'Customer feedback received: 5-star rating', timestamp: '2 hours ago', type: 'success' },
          { message: 'Dispatch updated job priority to urgent', timestamp: '3 hours ago', type: 'warning' },
        ],
      },
    ],
  };

  // Add mobile-specific widgets
  if (responsive.isMobile) {
    dashboardConfig.defaultWidgets.push({
      id: 'mobile-actions',
      type: 'list',
      title: 'Mobile Tools',
      subtitle: 'Technician utilities',
      size: 'full',
      priority: 8,
      data: [
        { 
          label: 'Take Photo', 
          value: 'Document work', 
          action: () => onNavigate?.('/camera') 
        },
        { 
          label: 'Customer Signature', 
          value: 'Completion sign-off', 
          action: () => onNavigate?.('/signature') 
        },
        { 
          label: 'GPS Navigation', 
          value: 'Next job location', 
          action: () => onNavigate?.('/navigation') 
        },
        { 
          label: 'Call Dispatch', 
          value: 'Emergency contact', 
          action: () => window.location.href = 'tel:+1234567890' 
        },
      ],
    });
  }

  return (
    <Dashboard
      userRole={USER_ROLES.TECHNICIAN}
      interfaceType={responsive.isMobile ? INTERFACE_TYPES.MOBILE : INTERFACE_TYPES.TECHNICIAN}
      customConfig={dashboardConfig}
      headerContent={headerContent}
      showCustomization={!responsive.isMobile}
      className={className}
      {...props}
    />
  );
};

export default TechnicianDashboard;