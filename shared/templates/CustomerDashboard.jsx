import React from 'react';
import { Dashboard, DashboardToolbar } from '../components/Dashboard';
import { USER_ROLES, INTERFACE_TYPES } from '../types/index.js';
import { Button } from '../components/Button';
import { useNotifications } from '../components/NotificationHub';
import { useResponsiveContext } from '../components/ResponsiveProvider';

/**
 * Customer Dashboard Template
 * Simplified dashboard for customer portal
 */

const CustomerDashboard = ({ 
  user,
  apiRequest,
  onNavigate,
  className,
  ...props 
}) => {
  const { showSuccess } = useNotifications();
  const { responsive } = useResponsiveContext();

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-request':
        onNavigate?.('/new-request');
        break;
      case 'support':
        onNavigate?.('/support');
        break;
      case 'billing':
        onNavigate?.('/billing');
        break;
      case 'feedback':
        showSuccess('Thank you!', 'Your feedback helps us improve our service.');
        break;
      default:
        onNavigate?.(action);
    }
  };

  const headerContent = responsive.isMobile ? (
    <Button
      variant="primary"
      size="sm"
      onClick={() => handleQuickAction('new-request')}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Request
    </Button>
  ) : (
    <div className="flex items-center space-x-3">
      <DashboardToolbar />
      
      <div className="border-l border-st-border-primary pl-3 flex items-center space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleQuickAction('new-request')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Service Request
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickAction('support')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Support
        </Button>
      </div>
    </div>
  );

  const dashboardConfig = {
    title: `Welcome back, ${user?.name?.split(' ')[0] || 'Customer'}`,
    subtitle: 'Your service requests and account overview',
    refreshInterval: 300000, // 5 minutes
    defaultLayout: responsive.isMobile ? 'stack' : 'grid',
    defaultWidgets: [
      {
        id: 'customer-stats',
        type: 'stats',
        title: 'Account Overview',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 1,
        data: [
          { label: 'Active Requests', key: 'activeRequests', icon: '🔧', color: 'primary' },
          { label: 'Completed Jobs', key: 'completedJobs', icon: '✅', color: 'success' },
          { label: 'Total Spent', key: 'totalSpent', icon: '💰', color: 'info', format: 'currency' },
          { label: 'Satisfaction', key: 'satisfaction', icon: '⭐', color: 'accent', format: 'rating' },
        ],
        refreshable: true,
      },
      {
        id: 'active-requests',
        type: 'list',
        title: 'Active Service Requests',
        subtitle: 'Current jobs in progress',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 2,
        refreshable: true,
        data: [
          { 
            label: 'HVAC Maintenance', 
            value: 'Scheduled for Tomorrow', 
            status: 'scheduled',
            action: () => onNavigate?.('/jobs/1234') 
          },
          { 
            label: 'Electrical Inspection', 
            value: 'Technician Assigned', 
            status: 'assigned',
            action: () => onNavigate?.('/jobs/1235') 
          },
          { 
            label: 'Plumbing Repair', 
            value: 'In Progress', 
            status: 'active',
            action: () => onNavigate?.('/jobs/1236') 
          },
        ],
      },
      {
        id: 'quick-actions',
        type: 'list',
        title: 'Quick Actions',
        subtitle: 'Common tasks and requests',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 3,
        data: [
          { 
            label: 'Schedule Service', 
            value: 'Book appointment', 
            action: () => handleQuickAction('new-request') 
          },
          { 
            label: 'View Invoices', 
            value: 'Billing history', 
            action: () => handleQuickAction('billing') 
          },
          { 
            label: 'Contact Support', 
            value: 'Get help', 
            action: () => handleQuickAction('support') 
          },
          { 
            label: 'Emergency Service', 
            value: '24/7 available', 
            action: () => onNavigate?.('/emergency') 
          },
        ],
      },
      {
        id: 'upcoming-appointments',
        type: 'calendar',
        title: 'Upcoming Appointments',
        subtitle: 'Your scheduled services',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 4,
        data: {
          appointments: [
            { date: '2024-01-15', time: '10:00 AM', service: 'HVAC Maintenance' },
            { date: '2024-01-18', time: '2:00 PM', service: 'Electrical Inspection' },
          ],
        },
      },
      {
        id: 'service-history',
        type: 'table',
        title: 'Recent Service History',
        subtitle: 'Last 5 completed jobs',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 5,
        data: {
          headers: ['Date', 'Service', 'Technician', 'Status'],
          rows: [
            ['Jan 10, 2024', 'Plumbing Repair', 'John Doe', 'Completed'],
            ['Dec 28, 2023', 'HVAC Service', 'Sarah Smith', 'Completed'],
            ['Dec 15, 2023', 'Electrical Work', 'Mike Johnson', 'Completed'],
            ['Nov 30, 2023', 'General Maintenance', 'Emily Davis', 'Completed'],
            ['Nov 18, 2023', 'Emergency Repair', 'Chris Wilson', 'Completed'],
          ],
        },
      },
      {
        id: 'account-info',
        type: 'progress',
        title: 'Account Status',
        subtitle: 'Your account health',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 6,
        data: [
          { label: 'Service Plan Coverage', value: 85, color: 'success' },
          { label: 'Payment Status', value: 100, color: 'primary' },
          { label: 'Loyalty Points', value: 65, color: 'accent' },
        ],
      },
      {
        id: 'recent-activity',
        type: 'activity',
        title: 'Recent Activity',
        subtitle: 'Updates and notifications',
        size: responsive.isMobile ? 'full' : 'large',
        priority: 7,
        data: [
          { message: 'HVAC maintenance scheduled for tomorrow at 10:00 AM', timestamp: '2 hours ago', type: 'info' },
          { message: 'Plumbing repair completed successfully', timestamp: '1 day ago', type: 'success' },
          { message: 'Invoice #INV-001234 is now available', timestamp: '2 days ago', type: 'info' },
          { message: 'Technician John Doe rated 5 stars', timestamp: '3 days ago', type: 'success' },
          { message: 'Service plan renewed for another year', timestamp: '1 week ago', type: 'success' },
        ],
      },
      {
        id: 'satisfaction-survey',
        type: 'metric',
        title: 'Rate Our Service',
        subtitle: 'Help us improve',
        size: responsive.isMobile ? 'full' : 'medium',
        priority: 8,
        data: {
          value: '⭐⭐⭐⭐⭐',
          label: 'How was your last service?',
          color: 'accent',
          action: () => handleQuickAction('feedback'),
        },
      },
    ],
  };

  // Add customer-specific mobile widgets
  if (responsive.isMobile) {
    dashboardConfig.defaultWidgets.push({
      id: 'mobile-contact',
      type: 'list',
      title: 'Contact Options',
      subtitle: 'Get in touch quickly',
      size: 'full',
      priority: 9,
      data: [
        { 
          label: 'Call Us', 
          value: '(555) 123-4567', 
          action: () => window.location.href = 'tel:+15551234567' 
        },
        { 
          label: 'Email Support', 
          value: 'help@swifttiger.com', 
          action: () => window.location.href = 'mailto:help@swifttiger.com' 
        },
        { 
          label: 'Live Chat', 
          value: 'Online now', 
          action: () => onNavigate?.('/chat') 
        },
        { 
          label: 'Emergency Line', 
          value: '24/7 available', 
          action: () => window.location.href = 'tel:+15551234911' 
        },
      ],
    });
  }

  return (
    <Dashboard
      userRole={USER_ROLES.CUSTOMER}
      interfaceType={INTERFACE_TYPES.CUSTOMER}
      customConfig={dashboardConfig}
      headerContent={headerContent}
      showCustomization={!responsive.isMobile}
      className={className}
      {...props}
    />
  );
};

export default CustomerDashboard;