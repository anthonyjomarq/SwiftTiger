import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User connected: ${socket.userName} (${socket.userId})`);
      
      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
      }

      // Join user to their role-based room
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      // Join user to their personal room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Handle job-related events
      socket.on('join-job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        logger.info(`User ${socket.userName} joined job room: ${jobId}`);
      });

      socket.on('leave-job', (jobId: string) => {
        socket.leave(`job:${jobId}`);
        logger.info(`User ${socket.userName} left job room: ${jobId}`);
      });

      // Handle technician location updates
      socket.on('location-update', (data: { latitude: number; longitude: number; timestamp: Date }) => {
        if (socket.userRole === 'technician') {
          // Broadcast to dispatchers and managers
          socket.to('role:dispatcher').to('role:manager').emit('technician-location', {
            technicianId: socket.userId,
            technicianName: socket.userName,
            ...data
          });
        }
      });

      // Handle typing indicators for job logs
      socket.on('job-log-typing', (data: { jobId: string; isTyping: boolean }) => {
        socket.to(`job:${data.jobId}`).emit('job-log-typing', {
          userId: socket.userId,
          userName: socket.userName,
          jobId: data.jobId,
          isTyping: data.isTyping
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`User disconnected: ${socket.userName} (${reason})`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.name;

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  // Job-related notifications
  public notifyJobCreated(job: any, assignedUserId?: string) {
    const notification = {
      type: 'job_created',
      data: job,
      timestamp: new Date()
    };

    // Notify dispatchers and managers
    this.io.to('role:dispatcher').to('role:manager').emit('job-notification', notification);

    // Notify assigned technician
    if (assignedUserId) {
      this.io.to(`user:${assignedUserId}`).emit('job-notification', notification);
    }
  }

  public notifyJobUpdated(job: any, previousJob?: any) {
    const notification = {
      type: 'job_updated',
      data: job,
      previousData: previousJob,
      timestamp: new Date()
    };

    // Notify all users in the job room
    this.io.to(`job:${job.id}`).emit('job-notification', notification);

    // Notify assigned technician
    if (job.assignedTo) {
      this.io.to(`user:${job.assignedTo}`).emit('job-notification', notification);
    }

    // Notify dispatchers and managers
    this.io.to('role:dispatcher').to('role:manager').emit('job-notification', notification);
  }

  public notifyJobStatusChanged(job: any, oldStatus: string, newStatus: string) {
    const notification = {
      type: 'job_status_changed',
      data: {
        ...job,
        oldStatus,
        newStatus
      },
      timestamp: new Date()
    };

    // Notify all relevant users
    this.io.to(`job:${job.id}`).emit('job-status-changed', notification);
    
    if (job.assignedTo) {
      this.io.to(`user:${job.assignedTo}`).emit('job-notification', notification);
    }

    this.io.to('role:dispatcher').to('role:manager').emit('job-notification', notification);
  }

  public notifyJobLogCreated(jobId: string, jobLog: any) {
    const notification = {
      type: 'job_log_created',
      data: jobLog,
      timestamp: new Date()
    };

    // Notify users in the job room
    this.io.to(`job:${jobId}`).emit('job-log-created', notification);
    
    // Notify dispatchers and managers
    this.io.to('role:dispatcher').to('role:manager').emit('job-notification', notification);
  }

  // Dashboard updates
  public notifyDashboardUpdate(data: any) {
    this.io.to('role:admin').to('role:manager').to('role:dispatcher').emit('dashboard-update', {
      type: 'dashboard_update',
      data,
      timestamp: new Date()
    });
  }

  // System notifications
  public notifySystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info', targetRole?: string) {
    const notification = {
      type: 'system_message',
      data: { message, level: type },
      timestamp: new Date()
    };

    if (targetRole) {
      this.io.to(`role:${targetRole}`).emit('system-notification', notification);
    } else {
      this.io.emit('system-notification', notification);
    }
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  public getConnectedUsersByRole(role: string): AuthenticatedSocket[] {
    return Array.from(this.connectedUsers.values()).filter(socket => socket.userRole === role);
  }

  // Send notification to specific user
  public notifyUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('user-notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Broadcast to all connected users
  public broadcast(event: string, data: any) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });
  }
}

let webSocketService: WebSocketService;

export const initializeWebSocket = (server: HTTPServer): WebSocketService => {
  webSocketService = new WebSocketService(server);
  return webSocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return webSocketService;
};

export default WebSocketService;