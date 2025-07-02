/**
 * Core Notification Plugin
 * Integrates with the Universal Foundation notification system
 */

import { NOTIFICATION_TYPES, WEBSOCKET_EVENTS } from '../../types/index.js';

const NotificationPlugin = {
  name: 'notification',
  version: '1.0.0',
  description: 'Core notification system integration',
  author: 'SwiftTiger',
  priority: 10, // High priority core plugin

  // Plugin initialization
  async initialize(pluginManager) {
    console.log('Initializing Notification Plugin...');
    
    // Register notification service
    this.notificationService = null;
    this.websocketConnection = null;
    
    // Setup WebSocket connection for real-time notifications
    this.setupWebSocket();
    
    return true;
  },

  // Plugin hooks
  hooks: {
    // After job status change
    'job:status_changed': async (context) => {
      const { job, oldStatus, newStatus, user } = context;
      
      await NotificationPlugin.sendJobStatusNotification(job, oldStatus, newStatus, user);
      return context;
    },

    // After job assignment
    'job:assigned': async (context) => {
      const { job, technician, user } = context;
      
      await NotificationPlugin.sendJobAssignmentNotification(job, technician, user);
      return context;
    },

    // After job completion
    'job:completed': async (context) => {
      const { job, technician, customer } = context;
      
      await NotificationPlugin.sendJobCompletionNotification(job, technician, customer);
      return context;
    },

    // System alerts
    'system:alert': async (context) => {
      const { level, message, data } = context;
      
      await NotificationPlugin.sendSystemAlert(level, message, data);
      return context;
    },

    // User login
    'user:login': async (context) => {
      const { user, location, device } = context;
      
      if (user.role === 'admin') {
        await NotificationPlugin.sendLoginNotification(user, location, device);
      }
      
      return context;
    },
  },

  // Setup WebSocket connection
  setupWebSocket() {
    try {
      // In a real implementation, this would connect to your WebSocket server
      this.websocketConnection = {
        send: (event, data) => {
          console.log('WebSocket send:', event, data);
          // Actual WebSocket implementation would go here
        },
        on: (event, handler) => {
          console.log('WebSocket listener:', event);
          // Actual WebSocket event listener would go here
        }
      };
      
      console.log('WebSocket connection established');
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  },

  // Send job status change notification
  async sendJobStatusNotification(job, oldStatus, newStatus, user) {
    const notifications = [];

    // Notify customer
    if (job.customer_id) {
      notifications.push({
        type: NOTIFICATION_TYPES.JOB_STATUS_CHANGE,
        recipient: job.customer_id,
        title: 'Job Status Updated',
        message: `Your job "${job.title}" status changed from ${oldStatus} to ${newStatus}`,
        data: { jobId: job.id, oldStatus, newStatus },
        channels: ['in-app', 'email'],
      });
    }

    // Notify technician if different from user who made the change
    if (job.technician_id && job.technician_id !== user.id) {
      notifications.push({
        type: NOTIFICATION_TYPES.JOB_STATUS_CHANGE,
        recipient: job.technician_id,
        title: 'Job Status Updated',
        message: `Job "${job.title}" status changed to ${newStatus}`,
        data: { jobId: job.id, newStatus },
        channels: ['in-app', 'push'],
      });
    }

    // Notify dispatchers for important status changes
    if (['completed', 'cancelled', 'on_hold'].includes(newStatus)) {
      notifications.push({
        type: NOTIFICATION_TYPES.JOB_STATUS_CHANGE,
        recipient: 'role:dispatcher',
        title: 'Job Status Alert',
        message: `Job #${job.id} marked as ${newStatus}`,
        data: { jobId: job.id, newStatus },
        channels: ['in-app'],
      });
    }

    return this.sendNotifications(notifications);
  },

  // Send job assignment notification
  async sendJobAssignmentNotification(job, technician, user) {
    const notifications = [];

    // Notify assigned technician
    notifications.push({
      type: NOTIFICATION_TYPES.JOB_ASSIGNMENT,
      recipient: technician.id,
      title: 'New Job Assignment',
      message: `You have been assigned to job "${job.title}"`,
      data: { jobId: job.id, jobTitle: job.title },
      channels: ['in-app', 'push', 'sms'],
      priority: 'high',
    });

    // Notify customer about technician assignment
    if (job.customer_id) {
      notifications.push({
        type: NOTIFICATION_TYPES.JOB_ASSIGNMENT,
        recipient: job.customer_id,
        title: 'Technician Assigned',
        message: `${technician.name} has been assigned to your job "${job.title}"`,
        data: { jobId: job.id, technicianName: technician.name },
        channels: ['in-app', 'email'],
      });
    }

    return this.sendNotifications(notifications);
  },

  // Send job completion notification
  async sendJobCompletionNotification(job, technician, customer) {
    const notifications = [];

    // Notify customer
    notifications.push({
      type: NOTIFICATION_TYPES.JOB_UPDATE,
      recipient: customer.id,
      title: 'Job Completed',
      message: `Your job "${job.title}" has been completed by ${technician.name}`,
      data: { jobId: job.id, technicianName: technician.name },
      channels: ['in-app', 'email', 'sms'],
      actions: [
        { label: 'Rate Service', action: 'rate_job', data: { jobId: job.id } },
        { label: 'View Details', action: 'view_job', data: { jobId: job.id } },
      ],
    });

    // Notify managers about completion
    notifications.push({
      type: NOTIFICATION_TYPES.JOB_UPDATE,
      recipient: 'role:manager',
      title: 'Job Completed',
      message: `Job #${job.id} completed by ${technician.name}`,
      data: { jobId: job.id, technicianId: technician.id },
      channels: ['in-app'],
    });

    return this.sendNotifications(notifications);
  },

  // Send system alert
  async sendSystemAlert(level, message, data) {
    const notifications = [];

    // Determine recipients based on alert level
    let recipients = [];
    let channels = ['in-app'];

    switch (level) {
      case 'critical':
        recipients = ['role:admin'];
        channels = ['in-app', 'email', 'sms', 'push'];
        break;
      case 'warning':
        recipients = ['role:admin', 'role:manager'];
        channels = ['in-app', 'email'];
        break;
      case 'info':
        recipients = ['role:admin'];
        channels = ['in-app'];
        break;
    }

    for (const recipient of recipients) {
      notifications.push({
        type: NOTIFICATION_TYPES.SYSTEM,
        recipient,
        title: `System Alert (${level.toUpperCase()})`,
        message,
        data,
        channels,
        priority: level === 'critical' ? 'urgent' : 'normal',
      });
    }

    return this.sendNotifications(notifications);
  },

  // Send login notification for admins
  async sendLoginNotification(user, location, device) {
    const notification = {
      type: NOTIFICATION_TYPES.SYSTEM,
      recipient: user.id,
      title: 'Admin Login Detected',
      message: `Admin login from ${device.type} at ${location.city || 'Unknown location'}`,
      data: { userId: user.id, location, device, timestamp: new Date() },
      channels: ['in-app', 'email'],
    };

    return this.sendNotifications([notification]);
  },

  // Send notifications through appropriate channels
  async sendNotifications(notifications) {
    const results = [];

    for (const notification of notifications) {
      try {
        // Send through each specified channel
        for (const channel of notification.channels) {
          const result = await this.sendNotificationChannel(notification, channel);
          results.push(result);
        }

        // Send real-time notification via WebSocket
        if (this.websocketConnection) {
          this.websocketConnection.send(WEBSOCKET_EVENTS.NOTIFICATION, {
            recipient: notification.recipient,
            data: notification,
          });
        }

      } catch (error) {
        console.error('Failed to send notification:', error);
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  },

  // Send notification through specific channel
  async sendNotificationChannel(notification, channel) {
    switch (channel) {
      case 'in-app':
        return this.sendInAppNotification(notification);
      case 'email':
        return this.sendEmailNotification(notification);
      case 'sms':
        return this.sendSMSNotification(notification);
      case 'push':
        return this.sendPushNotification(notification);
      default:
        throw new Error(`Unknown notification channel: ${channel}`);
    }
  },

  // In-app notification (stored in database)
  async sendInAppNotification(notification) {
    // In a real implementation, this would save to database
    console.log('In-app notification:', notification);
    return { success: true, channel: 'in-app' };
  },

  // Email notification
  async sendEmailNotification(notification) {
    // In a real implementation, this would integrate with email service
    console.log('Email notification:', notification);
    return { success: true, channel: 'email' };
  },

  // SMS notification
  async sendSMSNotification(notification) {
    // In a real implementation, this would integrate with SMS service
    console.log('SMS notification:', notification);
    return { success: true, channel: 'sms' };
  },

  // Push notification
  async sendPushNotification(notification) {
    // In a real implementation, this would integrate with push service
    console.log('Push notification:', notification);
    return { success: true, channel: 'push' };
  },

  // API endpoints for notification management
  apiEndpoints: [
    {
      method: 'GET',
      path: '/api/notifications/test',
      handler: async (req, res) => {
        const testNotification = {
          type: NOTIFICATION_TYPES.INFO,
          recipient: req.user.id,
          title: 'Test Notification',
          message: 'This is a test notification from the plugin system',
          channels: ['in-app'],
        };

        await NotificationPlugin.sendNotifications([testNotification]);
        
        res.json({
          success: true,
          message: 'Test notification sent',
        });
      },
    },
  ],

  // Dashboard widgets
  dashboardWidgets: {
    'notification-center': {
      name: 'Notification Center',
      type: 'list',
      roles: ['admin', 'manager'],
      fetchData: async (context) => {
        // Return recent notifications
        return [
          { label: 'System Alert', value: '2 new alerts', action: '/admin/alerts' },
          { label: 'Job Updates', value: '5 updates', action: '/jobs?filter=updated' },
          { label: 'User Activity', value: '12 new actions', action: '/activity' },
        ];
      },
    },
  },
};

export default NotificationPlugin;