/**
 * Core Authentication Plugin
 * Handles authentication, authorization, and session management
 */

import { USER_ROLES } from '../../types/index.js';

const AuthPlugin = {
  name: 'auth',
  version: '1.0.0',
  description: 'Core authentication and authorization system',
  author: 'SwiftTiger',
  priority: 5, // Very high priority core plugin

  // Plugin initialization
  async initialize(pluginManager) {
    console.log('Initializing Auth Plugin...');
    
    // Setup authentication state
    this.sessions = new Map();
    this.permissions = new Map();
    this.loginAttempts = new Map();
    
    // Initialize role-based permissions
    this.setupRolePermissions();
    
    return true;
  },

  // Plugin hooks
  hooks: {
    // Before any API request
    'api:request': async (context) => {
      const { req, res } = context;
      
      // Skip auth for public endpoints
      if (AuthPlugin.isPublicEndpoint(req.path)) {
        return context;
      }
      
      // Validate authentication
      const authResult = await AuthPlugin.validateAuthentication(req);
      if (!authResult.success) {
        res.status(401).json({ error: 'Authentication required' });
        return null; // Stop processing
      }
      
      // Add user to context
      context.user = authResult.user;
      context.permissions = AuthPlugin.getUserPermissions(authResult.user);
      
      return context;
    },

    // Before sensitive operations
    'operation:authorize': async (context) => {
      const { user, operation, resource } = context;
      
      const authorized = await AuthPlugin.checkPermission(user, operation, resource);
      if (!authorized) {
        throw new Error('Insufficient permissions');
      }
      
      return context;
    },

    // After successful login
    'user:login': async (context) => {
      const { user, req } = context;
      
      // Create session
      const session = await AuthPlugin.createSession(user, req);
      context.session = session;
      
      // Update login tracking
      await AuthPlugin.trackLogin(user, req);
      
      // Clear failed login attempts
      AuthPlugin.clearLoginAttempts(user.email);
      
      return context;
    },

    // Before logout
    'user:logout': async (context) => {
      const { user, sessionId } = context;
      
      // Destroy session
      await AuthPlugin.destroySession(sessionId);
      
      // Track logout
      await AuthPlugin.trackLogout(user);
      
      return context;
    },

    // After failed login
    'auth:failed': async (context) => {
      const { email, req } = context;
      
      // Track failed attempt
      await AuthPlugin.trackFailedLogin(email, req);
      
      // Check for account lockout
      if (AuthPlugin.shouldLockAccount(email)) {
        await AuthPlugin.lockAccount(email);
        context.accountLocked = true;
      }
      
      return context;
    },
  },

  // Setup role-based permissions
  setupRolePermissions() {
    const permissions = {
      [USER_ROLES.ADMIN]: [
        'system.*',
        'users.*',
        'jobs.*',
        'customers.*',
        'reports.*',
        'settings.*',
      ],
      [USER_ROLES.MANAGER]: [
        'jobs.*',
        'customers.read',
        'customers.update',
        'users.read',
        'reports.read',
        'reports.create',
      ],
      [USER_ROLES.DISPATCHER]: [
        'jobs.read',
        'jobs.update',
        'jobs.assign',
        'customers.read',
        'scheduling.*',
      ],
      [USER_ROLES.TECHNICIAN]: [
        'jobs.read',
        'jobs.update',
        'jobs.assigned',
        'updates.create',
        'timetracking.*',
      ],
      [USER_ROLES.CUSTOMER]: [
        'jobs.own',
        'requests.create',
        'profile.update',
        'billing.read',
      ],
    };

    for (const [role, perms] of Object.entries(permissions)) {
      this.permissions.set(role, perms);
    }
  },

  // Check if endpoint is public
  isPublicEndpoint(path) {
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/health',
      '/api/public',
    ];

    return publicPaths.some(publicPath => path.startsWith(publicPath));
  },

  // Validate authentication token
  async validateAuthentication(req) {
    try {
      const token = AuthPlugin.extractToken(req);
      if (!token) {
        return { success: false, error: 'No token provided' };
      }

      // In a real implementation, you would verify JWT token
      // For now, simulate token validation
      const session = this.sessions.get(token);
      if (!session) {
        return { success: false, error: 'Invalid token' };
      }

      // Check session expiry
      if (session.expiresAt < new Date()) {
        this.sessions.delete(token);
        return { success: false, error: 'Token expired' };
      }

      // Update last activity
      session.lastActivity = new Date();

      return { success: true, user: session.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Extract token from request
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies
    return req.cookies?.token;
  },

  // Get user permissions
  getUserPermissions(user) {
    const rolePermissions = this.permissions.get(user.role) || [];
    const userPermissions = user.permissions || [];
    
    return [...rolePermissions, ...userPermissions];
  },

  // Check if user has permission
  async checkPermission(user, operation, resource) {
    const permissions = this.getUserPermissions(user);
    
    // Check for wildcard permissions
    const wildcardPermission = `${resource}.*`;
    if (permissions.includes(wildcardPermission) || permissions.includes('*')) {
      return true;
    }
    
    // Check for specific permission
    const specificPermission = `${resource}.${operation}`;
    if (permissions.includes(specificPermission)) {
      return true;
    }
    
    // Check for resource ownership (for customers and technicians)
    if (operation === 'own' || operation === 'assigned') {
      return this.checkResourceOwnership(user, resource, operation);
    }
    
    return false;
  },

  // Check resource ownership
  checkResourceOwnership(user, resource, operation) {
    // This would typically query the database to check ownership
    // For now, return true as a placeholder
    return true;
  },

  // Create session
  async createSession(user, req) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastActivity: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    this.sessions.set(sessionId, session);
    
    return session;
  },

  // Destroy session
  async destroySession(sessionId) {
    return this.sessions.delete(sessionId);
  },

  // Generate session ID
  generateSessionId() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  },

  // Track login
  async trackLogin(user, req) {
    console.log(`User ${user.email} logged in from ${req.ip}`);
    
    // In a real implementation, save to database
    // await db.userActivity.create({
    //   userId: user.id,
    //   action: 'login',
    //   ipAddress: req.ip,
    //   userAgent: req.headers['user-agent'],
    //   timestamp: new Date(),
    // });
  },

  // Track logout
  async trackLogout(user) {
    console.log(`User ${user.email} logged out`);
    
    // In a real implementation, save to database
  },

  // Track failed login
  async trackFailedLogin(email, req) {
    const attempts = this.loginAttempts.get(email) || [];
    attempts.push({
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    this.loginAttempts.set(email, attempts);
    
    console.log(`Failed login attempt for ${email} from ${req.ip}`);
  },

  // Clear login attempts
  clearLoginAttempts(email) {
    this.loginAttempts.delete(email);
  },

  // Check if account should be locked
  shouldLockAccount(email) {
    const attempts = this.loginAttempts.get(email) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < 15 * 60 * 1000 // 15 minutes
    );
    
    return recentAttempts.length >= 5; // Lock after 5 failed attempts
  },

  // Lock account
  async lockAccount(email) {
    console.log(`Account locked for ${email}`);
    
    // In a real implementation, update database
    // await db.users.update({ email }, { accountLocked: true, lockedAt: new Date() });
  },

  // Middleware for route protection
  middleware: [
    // Rate limiting middleware
    async (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const key = `rate_limit:${ip}`;
      
      // Simple in-memory rate limiting (use Redis in production)
      if (!AuthPlugin.rateLimitStore) {
        AuthPlugin.rateLimitStore = new Map();
      }
      
      const now = Date.now();
      const requests = AuthPlugin.rateLimitStore.get(key) || [];
      
      // Remove old requests (older than 1 minute)
      const validRequests = requests.filter(time => now - time < 60000);
      
      if (validRequests.length >= 100) { // 100 requests per minute
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      validRequests.push(now);
      AuthPlugin.rateLimitStore.set(key, validRequests);
      
      next();
    },
  ],

  // API endpoints
  apiEndpoints: [
    {
      method: 'GET',
      path: '/api/auth/me',
      handler: async (req, res) => {
        const user = req.user;
        if (!user) {
          return res.status(401).json({ error: 'Not authenticated' });
        }
        
        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
            permissions: AuthPlugin.getUserPermissions(user),
          },
        });
      },
    },
    
    {
      method: 'POST',
      path: '/api/auth/refresh',
      handler: async (req, res) => {
        const token = AuthPlugin.extractToken(req);
        const session = AuthPlugin.sessions.get(token);
        
        if (!session) {
          return res.status(401).json({ error: 'Invalid session' });
        }
        
        // Extend session
        session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        session.lastActivity = new Date();
        
        res.json({
          success: true,
          data: { expiresAt: session.expiresAt },
        });
      },
    },
    
    {
      method: 'GET',
      path: '/api/auth/sessions',
      handler: async (req, res) => {
        // Only admins can view all sessions
        if (req.user.role !== USER_ROLES.ADMIN) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        const sessions = Array.from(AuthPlugin.sessions.values()).map(session => ({
          id: session.id,
          user: session.user,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          ipAddress: session.ipAddress,
        }));
        
        res.json({
          success: true,
          data: sessions,
        });
      },
    },
  ],

  // Dashboard widgets
  dashboardWidgets: {
    'auth-status': {
      name: 'Authentication Status',
      type: 'stats',
      roles: ['admin'],
      fetchData: async (context) => {
        const activeSessions = AuthPlugin.sessions.size;
        const failedAttempts = Array.from(AuthPlugin.loginAttempts.values())
          .reduce((total, attempts) => total + attempts.length, 0);
        
        return [
          { label: 'Active Sessions', value: activeSessions, icon: '👥', color: 'primary' },
          { label: 'Failed Attempts', value: failedAttempts, icon: '🚫', color: 'error' },
        ];
      },
    },
  },
};

export default AuthPlugin;