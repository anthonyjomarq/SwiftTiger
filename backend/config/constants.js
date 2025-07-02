/**
 * Backend Configuration Constants
 * Centralized configuration for SwiftTiger backend
 */

// Job Statuses
const JOB_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ON_HOLD: "on_hold",
};

// Job Priority Levels
const JOB_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
  EMERGENCY: "emergency",
};

// Job Note Types
const NOTE_TYPES = {
  GENERAL: "general",
  TECHNICAL: "technical",
  CUSTOMER: "customer",
  INTERNAL: "internal",
  STATUS_CHANGE: "status_change",
};

// User Roles
const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  TECHNICIAN: "technician",
  DISPATCHER: "dispatcher",
};

// Permission Names
const PERMISSIONS = {
  // Customer permissions
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_EDIT: "customers.edit",
  CUSTOMERS_DELETE: "customers.delete",

  // Job permissions
  JOBS_VIEW: "jobs.view",
  JOBS_VIEW_ASSIGNED: "jobs.view_assigned",
  JOBS_CREATE: "jobs.create",
  JOBS_EDIT: "jobs.edit",
  JOBS_DELETE: "jobs.delete",
  JOBS_ASSIGN: "jobs.assign",
  JOBS_UPDATE_STATUS: "jobs.update_status",
  JOBS_CLOSE: "jobs.close",

  // User permissions
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",

  // Dashboard permissions
  DASHBOARD_VIEW: "dashboard.view",

  // Route permissions
  ROUTES_VIEW: "routes.view",

  // Realtime permissions
  REALTIME_VIEW_LOCATIONS: "realtime.viewLocations",
  REALTIME_VIEW_STATUS: "realtime.viewStatus",
};

// Default Pagination Values
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

// API Rate Limits
const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // requests per window
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes for auth endpoints
  AUTH_MAX_REQUESTS: 5, // 5 attempts per 15 minutes for auth
  UPLOAD_WINDOW_MS: 60 * 1000, // 1 minute for uploads
  UPLOAD_MAX_REQUESTS: 10, // 10 uploads per minute
};

// Validation Rules
const VALIDATION = {
  // Job validation
  JOB_TITLE_MIN_LENGTH: 1,
  JOB_TITLE_MAX_LENGTH: 255,
  JOB_DESCRIPTION_MAX_LENGTH: 1000,
  JOB_ESTIMATED_DURATION_MIN: 1,
  JOB_ESTIMATED_DURATION_MAX: 1440, // 24 hours in minutes

  // Customer validation
  CUSTOMER_NAME_MIN_LENGTH: 1,
  CUSTOMER_NAME_MAX_LENGTH: 255,
  CUSTOMER_ADDRESS_MAX_LENGTH: 1000,

  // User validation
  USER_NAME_MIN_LENGTH: 2,
  USER_NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // Search validation
  SEARCH_MIN_LENGTH: 1,
  SEARCH_MAX_LENGTH: 100,

  // Coordinates validation
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
};

// Database Configuration
const DATABASE = {
  TABLES: {
    USERS: "users",
    JOBS: "jobs",
    CUSTOMERS: "customers",
    JOB_UPDATES: "job_updates",
    PERMISSIONS: "permissions",
    ROLE_PERMISSIONS: "role_permissions",
    TECHNICIAN_LOCATIONS: "technician_locations",
    ACTIVITY_LOG: "activity_log",
    NOTIFICATIONS: "notifications",
    SESSIONS: "user_sessions",
  },

  // Default values
  DEFAULTS: {
    JOB_STATUS: JOB_STATUSES.PENDING,
    JOB_PRIORITY: JOB_PRIORITIES.NORMAL,
    USER_ROLE: USER_ROLES.TECHNICIAN,
    JOB_ESTIMATED_DURATION: 60, // 1 hour in minutes
  },
};

// WebSocket Events
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Job events
  JOB_CREATED: "job:created",
  JOB_UPDATED: "job:updated",
  JOB_DELETED: "job:deleted",
  JOB_STATUS_CHANGED: "job:status_changed",

  // User events
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_PRESENCE: "user:presence",
  USERS_ONLINE: "users:online",

  // Location events
  LOCATION_UPDATE: "location:update",
  TECHNICIAN_LOCATION: "technician:location",

  // Notification events
  NOTIFICATION: "notification",
  NOTIFICATION_READ: "notification:read",

  // Activity events
  ACTIVITY_LOG: "activity:log",

  // Room events
  JOIN_TECHNICIAN_ROOM: "join_technician_room",
  LEAVE_TECHNICIAN_ROOM: "leave_technician_room",
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",
  AUTHENTICATION_REQUIRED: "Authentication required",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  RESOURCE_NOT_FOUND: "Resource not found",
  RESOURCE_ALREADY_EXISTS: "Resource already exists",
  INTERNAL_SERVER_ERROR: "Internal server error",
  NETWORK_ERROR: "Network error",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
};

// File Upload Configuration
const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  UPLOAD_DIR: "uploads",
  MAX_FILES_PER_REQUEST: 5,
};

// JWT Configuration
const JWT = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  VERIFICATION_TOKEN_EXPIRY: "24h",
  RESET_PASSWORD_TOKEN_EXPIRY: "1h",
};

// Email Configuration
const EMAIL = {
  FROM_ADDRESS: "noreply@swifttiger.com",
  FROM_NAME: "SwiftTiger",
  SUBJECTS: {
    WELCOME: "Welcome to SwiftTiger",
    PASSWORD_RESET: "Password Reset Request",
    EMAIL_VERIFICATION: "Verify Your Email Address",
    JOB_ASSIGNMENT: "New Job Assignment",
    JOB_UPDATE: "Job Update Notification",
  },
};

// Route Optimization Configuration
const ROUTE_OPTIMIZATION = {
  ALGORITHMS: {
    NEAREST_NEIGHBOR: "nearest_neighbor",
    GENETIC: "genetic",
    TWO_OPT: "2-opt",
  },
  TRAVEL_MODES: {
    DRIVING: "driving",
    WALKING: "walking",
    BICYCLING: "bicycling",
    TRANSIT: "transit",
  },
  DEFAULT_OPTIONS: {
    AVOID_TOLLS: false,
    AVOID_HIGHWAYS: false,
    CONSIDER_TRAFFIC: true,
    MAX_DISTANCE: 50000, // 50km in meters
    MAX_DURATION: 28800, // 8 hours in seconds
  },
};

module.exports = {
  JOB_STATUSES,
  JOB_PRIORITIES,
  NOTE_TYPES,
  USER_ROLES,
  PERMISSIONS,
  PAGINATION,
  RATE_LIMITS,
  VALIDATION,
  DATABASE,
  SOCKET_EVENTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  FILE_UPLOAD,
  JWT,
  EMAIL,
  ROUTE_OPTIMIZATION,
};
