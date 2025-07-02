/**
 * Universal Type Definitions
 * Shared types across all SwiftTiger interfaces
 */

// Job Status Types
export const JOB_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
};

// Job Priority Types
export const JOB_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
};

// User Role Types
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DISPATCHER: 'dispatcher',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer',
};

// Note Types
export const NOTE_TYPES = {
  GENERAL: 'general',
  TECHNICAL: 'technical',
  CUSTOMER: 'customer',
  INTERNAL: 'internal',
  STATUS_CHANGE: 'status_change',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  JOB_ASSIGNMENT: 'job_assignment',
  JOB_STATUS_CHANGE: 'job_status_change',
  JOB_UPDATE: 'job_update',
  SYSTEM: 'system',
};

// Interface Types
export const INTERFACE_TYPES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer',
  MOBILE: 'mobile',
};

// Device Types
export const DEVICE_TYPES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile',
};

// Status Display Configurations
export const STATUS_CONFIG = {
  [JOB_STATUSES.PENDING]: {
    label: 'Pending',
    icon: '⏳',
    color: 'warning',
    description: 'Job is waiting to be started',
  },
  [JOB_STATUSES.IN_PROGRESS]: {
    label: 'In Progress',
    icon: '🔧',
    color: 'info',
    description: 'Job is currently being worked on',
  },
  [JOB_STATUSES.COMPLETED]: {
    label: 'Completed',
    icon: '✅',
    color: 'success',
    description: 'Job has been finished',
  },
  [JOB_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    icon: '❌',
    color: 'error',
    description: 'Job has been cancelled',
  },
  [JOB_STATUSES.ON_HOLD]: {
    label: 'On Hold',
    icon: '⏸️',
    color: 'warning',
    description: 'Job is temporarily paused',
  },
};

// Priority Display Configurations
export const PRIORITY_CONFIG = {
  [JOB_PRIORITIES.LOW]: {
    label: 'Low',
    icon: '🔽',
    color: 'gray',
    weight: 1,
  },
  [JOB_PRIORITIES.NORMAL]: {
    label: 'Normal',
    icon: '➖',
    color: 'blue',
    weight: 2,
  },
  [JOB_PRIORITIES.HIGH]: {
    label: 'High',
    icon: '🔼',
    color: 'orange',
    weight: 3,
  },
  [JOB_PRIORITIES.URGENT]: {
    label: 'Urgent',
    icon: '⚡',
    color: 'red',
    weight: 4,
  },
  [JOB_PRIORITIES.EMERGENCY]: {
    label: 'Emergency',
    icon: '🚨',
    color: 'red',
    weight: 5,
  },
};

// Role Display Configurations
export const ROLE_CONFIG = {
  [USER_ROLES.ADMIN]: {
    label: 'Administrator',
    icon: '👑',
    color: 'purple',
    permissions: ['all'],
  },
  [USER_ROLES.MANAGER]: {
    label: 'Manager',
    icon: '👔',
    color: 'blue',
    permissions: ['jobs', 'users', 'customers', 'reports'],
  },
  [USER_ROLES.DISPATCHER]: {
    label: 'Dispatcher',
    icon: '📋',
    color: 'green',
    permissions: ['jobs', 'customers', 'scheduling'],
  },
  [USER_ROLES.TECHNICIAN]: {
    label: 'Technician',
    icon: '🔧',
    color: 'orange',
    permissions: ['assigned_jobs', 'updates'],
  },
  [USER_ROLES.CUSTOMER]: {
    label: 'Customer',
    icon: '👤',
    color: 'gray',
    permissions: ['own_jobs', 'requests'],
  },
};

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Jobs
  JOBS: {
    LIST: '/api/jobs',
    CREATE: '/api/jobs',
    UPDATE: (id) => `/api/jobs/${id}`,
    DELETE: (id) => `/api/jobs/${id}`,
    GET: (id) => `/api/jobs/${id}`,
    TRANSITIONS: (id) => `/api/jobs/${id}/transitions`,
    WORKFLOW: (id) => `/api/jobs/${id}/workflow`,
    HISTORY: (id) => `/api/jobs/${id}/history`,
    UPDATES: (id) => `/api/jobs/${id}/updates`,
    UPDATE_NOTE: (jobId, updateId) => `/api/jobs/${jobId}/updates/${updateId}`,
    PIN_NOTE: (jobId, updateId) => `/api/jobs/${jobId}/updates/${updateId}/pin`,
    MAP_DATA: '/api/jobs/map-data',
  },
  
  // Customers
  CUSTOMERS: {
    LIST: '/api/customers',
    CREATE: '/api/customers',
    UPDATE: (id) => `/api/customers/${id}`,
    DELETE: (id) => `/api/customers/${id}`,
    GET: (id) => `/api/customers/${id}`,
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    UPDATE: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
    GET: (id) => `/api/users/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    SETTINGS: '/api/notifications/settings',
  },
  
  // Dashboard
  DASHBOARD: {
    STATS: '/api/dashboard',
    ACTIVITY: '/api/activity-feed',
  },
};

// Validation Rules
export const VALIDATION_RULES = {
  JOB: {
    TITLE_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    ESTIMATED_DURATION_MIN: 1,
    ESTIMATED_DURATION_MAX: 1440, // 24 hours
  },
  
  CUSTOMER: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 255,
    ADDRESS_MAX_LENGTH: 1000,
  },
  
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
  },
  
  NOTE: {
    CONTENT_MIN_LENGTH: 1,
    CONTENT_MAX_LENGTH: 2000,
  },
};

// Responsive Breakpoints
export const BREAKPOINTS = {
  XS: 480,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Time Formats
export const TIME_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  DATETIME_FULL: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'MMM D, YYYY',
  DISPLAY_DATETIME: 'MMM D, YYYY h:mm A',
};

// Default Pagination
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

// File Upload Configurations
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  MAX_FILES: 5,
};

// Map/Location Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: { lat: 40.7128, lng: -74.0060 }, // New York City
  MARKER_COLORS: {
    [JOB_STATUSES.PENDING]: '#f59e0b',
    [JOB_STATUSES.IN_PROGRESS]: '#3b82f6',
    [JOB_STATUSES.COMPLETED]: '#10b981',
    [JOB_STATUSES.CANCELLED]: '#ef4444',
    [JOB_STATUSES.ON_HOLD]: '#f3a26d',
  },
};

// WebSocket Events
export const WEBSOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Job Events
  JOB_CREATED: 'job:created',
  JOB_UPDATED: 'job:updated',
  JOB_DELETED: 'job:deleted',
  JOB_STATUS_CHANGED: 'job:status_changed',
  JOB_ASSIGNED: 'job:assigned',
  
  // User Events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_PRESENCE: 'user:presence',
  
  // Location Events
  LOCATION_UPDATE: 'location:update',
  TECHNICIAN_LOCATION: 'technician:location',
  
  // Notification Events
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification:read',
  
  // Activity Events
  ACTIVITY_LOG: 'activity:log',
};

// Feature Flags
export const FEATURE_FLAGS = {
  MOBILE_INTERFACE: true,
  CUSTOMER_PORTAL: true,
  REAL_TIME_NOTIFICATIONS: true,
  WORKFLOW_ANALYTICS: true,
  ROUTE_OPTIMIZATION: true,
  INVENTORY_MANAGEMENT: false, // Coming soon
  BILLING_INTEGRATION: false, // Coming soon
  ADVANCED_REPORTING: false, // Coming soon
};

// Interface-specific configurations
export const INTERFACE_CONFIG = {
  [INTERFACE_TYPES.ADMIN]: {
    layout: 'desktop',
    sidebar: true,
    notifications: true,
    features: ['all'],
  },
  
  [INTERFACE_TYPES.TECHNICIAN]: {
    layout: 'mobile',
    sidebar: false,
    notifications: true,
    features: ['jobs', 'updates', 'location'],
  },
  
  [INTERFACE_TYPES.CUSTOMER]: {
    layout: 'simple',
    sidebar: false,
    notifications: true,
    features: ['own_jobs', 'requests', 'history'],
  },
};

// Export utility functions for type checking
export const isValidStatus = (status) => Object.values(JOB_STATUSES).includes(status);
export const isValidPriority = (priority) => Object.values(JOB_PRIORITIES).includes(priority);
export const isValidRole = (role) => Object.values(USER_ROLES).includes(role);
export const isValidNoteType = (type) => Object.values(NOTE_TYPES).includes(type);

// Status transition helpers
export const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG[JOB_STATUSES.PENDING];
export const getPriorityConfig = (priority) => PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[JOB_PRIORITIES.NORMAL];
export const getRoleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG[USER_ROLES.CUSTOMER];

// Format helpers
export const formatStatus = (status) => getStatusConfig(status).label;
export const formatPriority = (priority) => getPriorityConfig(priority).label;
export const formatRole = (role) => getRoleConfig(role).label;