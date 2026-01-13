import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

interface WebSocketNotification {
  type: string;
  data: any;
  timestamp: Date;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: WebSocketNotification[];
  joinJobRoom: (jobId: string) => void;
  leaveJobRoom: (jobId: string) => void;
  updateLocation: (latitude: number, longitude: number) => void;
  sendTypingIndicator: (jobId: string, isTyping: boolean) => void;
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const reconnectAttemptRef = useRef(0);

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      toast.success('Real-time updates connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // Only show toast if it's not a manual disconnect
      if (reason !== 'io client disconnect') {
        toast.error('Real-time updates disconnected');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      
      // Implement exponential backoff for reconnection
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttemptRef.current) * 1000;
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current++;
          console.log(`Reconnection attempt ${reconnectAttemptRef.current}/${maxReconnectAttempts}`);
          connectSocket();
        }, delay);
      } else {
        toast.error('Failed to connect to real-time updates');
      }
    });

    // Job-related notifications
    newSocket.on('job-notification', (notification: WebSocketNotification) => {
      console.log('Job notification received:', notification);
      addNotification(notification);
      
      // Show toast notifications based on type
      switch (notification.type) {
        case 'job_created':
          toast.success(`New job created: ${notification.data.jobName}`);
          break;
        case 'job_updated':
          toast.info(`Job updated: ${notification.data.jobName}`);
          break;
        case 'job_status_changed':
          toast.success(`Job ${notification.data.jobName} status changed to ${notification.data.newStatus}`);
          break;
        default:
          toast.info('Job updated');
      }
    });

    newSocket.on('job-status-changed', (notification: WebSocketNotification) => {
      console.log('Job status changed:', notification);
      addNotification(notification);
    });

    newSocket.on('job-log-created', (notification: WebSocketNotification) => {
      console.log('Job log created:', notification);
      addNotification(notification);
      toast.info('New job log entry added');
    });

    // Technician location updates
    newSocket.on('technician-location', (data: any) => {
      console.log('📍 Technician location update:', data);
      addNotification({
        type: 'technician_location',
        data,
        timestamp: new Date()
      });
    });

    // Typing indicators
    newSocket.on('job-log-typing', (data: any) => {
      console.log('⌨️ Typing indicator:', data);
      // Handle typing indicators in job detail components
      addNotification({
        type: 'typing_indicator',
        data,
        timestamp: new Date()
      });
    });

    // Dashboard updates
    newSocket.on('dashboard-update', (notification: WebSocketNotification) => {
      console.log('Dashboard update:', notification);
      addNotification(notification);
    });

    // System notifications
    newSocket.on('system-notification', (notification: WebSocketNotification) => {
      console.log('🔔 System notification:', notification);
      addNotification(notification);
      
      const level = notification.data.level || 'info';
      switch (level) {
        case 'error':
          toast.error(notification.data.message);
          break;
        case 'warning':
          toast.error(notification.data.message, { icon: '⚠️' });
          break;
        default:
          toast.info(notification.data.message);
      }
    });

    // User-specific notifications
    newSocket.on('user-notification', (notification: WebSocketNotification) => {
      console.log('👤 User notification:', notification);
      addNotification(notification);
      toast.info('You have a new notification');
    });

    setSocket(newSocket);
  };

  const addNotification = (notification: WebSocketNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  const joinJobRoom = (jobId: string) => {
    if (socket) {
      socket.emit('join-job', jobId);
      console.log(`Joined job room: ${jobId}`);
    }
  };

  const leaveJobRoom = (jobId: string) => {
    if (socket) {
      socket.emit('leave-job', jobId);
      console.log(`Left job room: ${jobId}`);
    }
  };

  const updateLocation = (latitude: number, longitude: number) => {
    if (socket && isConnected) {
      socket.emit('location-update', {
        latitude,
        longitude,
        timestamp: new Date()
      });
    }
  };

  const sendTypingIndicator = (jobId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('job-log-typing', {
        jobId,
        isTyping
      });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    connectSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Only connect once on mount

  // Reconnect on auth token change
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socket?.connected) {
      connectSocket();
    }
  }, []);

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    notifications,
    joinJobRoom,
    leaveJobRoom,
    updateLocation,
    sendTypingIndicator,
    clearNotifications
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

