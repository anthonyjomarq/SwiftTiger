/**
 * Frontend Configuration Constants
 * Centralized configuration for SwiftTiger frontend
 */

// Route Paths
export const ROUTES = {
  // Authentication routes
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Main application routes
  DASHBOARD: "/",
  JOBS: "/jobs",
  JOB_CREATE: "/jobs/create",
  JOB_EDIT: "/jobs/:id/edit",
  JOB_DETAIL: "/jobs/:id",
  CUSTOMERS: "/customers",
  CUSTOMER_CREATE: "/customers/create",
  CUSTOMER_EDIT: "/customers/:id/edit",
  CUSTOMER_DETAIL: "/customers/:id",
  ROUTE_PLANNING: "/route-planning",
  SETTINGS: "/settings",
  PROFILE: "/profile",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    PERMISSIONS: "/auth/permissions",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    SEND_VERIFICATION: "/auth/send-verification",
    VERIFY_EMAIL: "/auth/verify-email",
    SESSIONS: "/auth/sessions",
  },

  // Jobs
  JOBS: {
    LIST: "/jobs",
    CREATE: "/jobs",
    GET: "/jobs/:id",
    UPDATE: "/jobs/:id",
    DELETE: "/jobs/:id",
    STATUS: "/jobs/:id/status",
    UPDATES: "/jobs/:id/updates",
    CREATE_UPDATE: "/jobs/:id/updates",
    MAP_DATA: "/jobs/map-data",
    OPTIMIZE_ROUTE: "/jobs/optimize-route",
    OPTIMIZE_ROUTE_ADVANCED: "/jobs/optimize-route-advanced",
    BY_TECHNICIAN: "/jobs/technician/:technicianId",
    BY_STATUS: "/jobs/status/:status",
    DEBUG: "/jobs/debug",
  },

  // Customers
  CUSTOMERS: {
    LIST: "/customers",
    CREATE: "/customers",
    GET: "/customers/:id",
    UPDATE: "/customers/:id",
    DELETE: "/customers/:id",
    GEOCODE: "/customers/:id/geocode",
    VALIDATE_EMAIL: "/customers/validate-email",
  },

  // Users
  USERS: {
    LIST: "/users",
    CREATE: "/users",
    GET: "/users/:id",
    UPDATE: "/users/:id",
    DELETE: "/users/:id",
    BY_ROLE: "/users/role/:role",
  },

  // Technicians
  TECHNICIANS: {
    LOCATION_UPDATE: "/technicians/:id/location",
    LOCATIONS: "/technicians/locations",
  },

  // Routes
  ROUTES: {
    SHARE: "/routes/share",
    SHARED: "/routes/shared/:token",
    OPTIMIZE: "/routes/optimize",
    ETA: "/routes/eta",
    DIRECTIONS: "/routes/directions",
    TRAFFIC: "/routes/traffic",
    SAVE: "/routes/save",
    SAVED: "/routes/saved",
    SAVED_DETAIL: "/routes/saved/:id",
    DELETE_SAVED: "/routes/saved/:id",
    STATISTICS: "/routes/statistics",
  },

  // ETA
  ETA: {
    CALCULATE: "/eta/calculate",
  },

  // Dashboard
  DASHBOARD: {
    STATS: "/dashboard",
    ACTIVITY_FEED: "/activity-feed",
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: "/notifications/:id/read",
    MARK_ALL_READ: "/notifications/mark-all-read",
  },

  // Maps
  MAPS: {
    CONFIG: "/maps-config",
  },
};

// UI Text and Labels
export const UI_TEXT = {
  // Common
  COMMON: {
    LOADING: "Loading...",
    SAVING: "Saving...",
    DELETING: "Deleting...",
    SUBMIT: "Submit",
    CANCEL: "Cancel",
    SAVE: "Save",
    DELETE: "Delete",
    EDIT: "Edit",
    VIEW: "View",
    CLOSE: "Close",
    BACK: "Back",
    NEXT: "Next",
    PREVIOUS: "Previous",
    SEARCH: "Search",
    FILTER: "Filter",
    CLEAR: "Clear",
    EXPORT: "Export",
    IMPORT: "Import",
    REFRESH: "Refresh",
    CONFIRM: "Confirm",
    YES: "Yes",
    NO: "No",
    OK: "OK",
    ERROR: "Error",
    SUCCESS: "Success",
    WARNING: "Warning",
    INFO: "Information",
  },

  // Job related
  JOBS: {
    TITLE: "Jobs",
    CREATE_TITLE: "Create New Job",
    EDIT_TITLE: "Edit Job",
    DETAIL_TITLE: "Job Details",
    STATUS: {
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      ON_HOLD: "On Hold",
    },
    FIELDS: {
      TITLE: "Job Title",
      DESCRIPTION: "Description",
      CUSTOMER: "Customer",
      ASSIGNED_TO: "Assigned To",
      STATUS: "Status",
      SCHEDULED_DATE: "Scheduled Date",
      SCHEDULED_TIME: "Scheduled Time",
      ESTIMATED_DURATION: "Estimated Duration",
      LOCATION: "Location",
      NOTES: "Notes",
    },
    ACTIONS: {
      CREATE: "Create Job",
      UPDATE: "Update Job",
      DELETE: "Delete Job",
      ASSIGN: "Assign Job",
      START: "Start Job",
      COMPLETE: "Complete Job",
      CANCEL: "Cancel Job",
      HOLD: "Put On Hold",
    },
  },

  // Customer related
  CUSTOMERS: {
    TITLE: "Customers",
    CREATE_TITLE: "Create New Customer",
    EDIT_TITLE: "Edit Customer",
    DETAIL_TITLE: "Customer Details",
    FIELDS: {
      NAME: "Customer Name",
      EMAIL: "Email Address",
      PHONE: "Phone Number",
      ADDRESS: "Address",
      NOTES: "Notes",
    },
    ACTIONS: {
      CREATE: "Create Customer",
      UPDATE: "Update Customer",
      DELETE: "Delete Customer",
      VIEW_JOBS: "View Jobs",
    },
  },

  // Navigation
  NAVIGATION: {
    DASHBOARD: "Dashboard",
    JOBS: "Jobs",
    CUSTOMERS: "Customers",
    ROUTE_PLANNING: "Route Planning",
    SETTINGS: "Settings",
    PROFILE: "Profile",
    LOGOUT: "Logout",
  },

  // Status messages
  MESSAGES: {
    SUCCESS: {
      JOB_CREATED: "Job created successfully",
      JOB_UPDATED: "Job updated successfully",
      JOB_DELETED: "Job deleted successfully",
      CUSTOMER_CREATED: "Customer created successfully",
      CUSTOMER_UPDATED: "Customer updated successfully",
      CUSTOMER_DELETED: "Customer deleted successfully",
      LOGIN_SUCCESS: "Login successful",
      LOGOUT_SUCCESS: "Logout successful",
    },
    ERROR: {
      NETWORK_ERROR: "Network error. Please check your connection.",
      VALIDATION_ERROR: "Please check your input and try again.",
      AUTH_ERROR: "Authentication failed. Please log in again.",
      PERMISSION_ERROR: "You do not have permission to perform this action.",
      NOT_FOUND: "The requested resource was not found.",
      SERVER_ERROR: "Server error. Please try again later.",
      UNKNOWN_ERROR: "An unexpected error occurred.",
    },
  },
};

// Validation Rules
export const VALIDATION = {
  // Job validation
  JOB: {
    TITLE: {
      REQUIRED: "Job title is required",
      MIN_LENGTH: "Job title must be at least 1 character",
      MAX_LENGTH: "Job title must not exceed 255 characters",
    },
    DESCRIPTION: {
      MAX_LENGTH: "Description must not exceed 1000 characters",
    },
    ESTIMATED_DURATION: {
      MIN: "Estimated duration must be at least 1 minute",
      MAX: "Estimated duration must not exceed 1440 minutes (24 hours)",
    },
    SCHEDULED_DATE: {
      INVALID: "Scheduled date must be a valid date (YYYY-MM-DD)",
    },
    SCHEDULED_TIME: {
      INVALID: "Scheduled time must be in HH:MM format",
    },
  },

  // Customer validation
  CUSTOMER: {
    NAME: {
      REQUIRED: "Customer name is required",
      MIN_LENGTH: "Customer name must be at least 1 character",
      MAX_LENGTH: "Customer name must not exceed 255 characters",
    },
    EMAIL: {
      INVALID: "Please enter a valid email address",
      REQUIRED: "Email address is required",
    },
    PHONE: {
      INVALID: "Please enter a valid phone number",
    },
    ADDRESS: {
      MAX_LENGTH: "Address must not exceed 1000 characters",
    },
  },

  // User validation
  USER: {
    NAME: {
      REQUIRED: "Name is required",
      MIN_LENGTH: "Name must be at least 2 characters",
      MAX_LENGTH: "Name must not exceed 100 characters",
    },
    EMAIL: {
      REQUIRED: "Email is required",
      INVALID: "Please enter a valid email address",
    },
    PASSWORD: {
      REQUIRED: "Password is required",
      MIN_LENGTH: "Password must be at least 8 characters",
      MAX_LENGTH: "Password must not exceed 128 characters",
    },
  },

  // Search validation
  SEARCH: {
    MIN_LENGTH: "Search term must be at least 1 character",
    MAX_LENGTH: "Search term must not exceed 100 characters",
  },
};

// Feature Flags
export const FEATURES = {
  // Core features
  CORE: {
    AUTHENTICATION: true,
    JOB_MANAGEMENT: true,
    CUSTOMER_MANAGEMENT: true,
    USER_MANAGEMENT: true,
    DASHBOARD: true,
  },

  // Advanced features
  ADVANCED: {
    ROUTE_OPTIMIZATION: true,
    REAL_TIME_TRACKING: true,
    NOTIFICATIONS: true,
    FILE_UPLOADS: true,
    OFFLINE_SUPPORT: true,
    PUSH_NOTIFICATIONS: false, // Disabled by default
    VOICE_COMMANDS: false, // Disabled by default
    AR_NAVIGATION: false, // Disabled by default
  },

  // Experimental features
  EXPERIMENTAL: {
    AI_JOB_ASSIGNMENT: false,
    PREDICTIVE_MAINTENANCE: false,
    ADVANCED_ANALYTICS: false,
    INTEGRATION_APIS: false,
  },
};

// UI Configuration
export const UI_CONFIG = {
  // Table configuration
  TABLE: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    ROW_HEIGHT: 52,
    VIRTUALIZATION_THRESHOLD: 20,
  },

  // Form configuration
  FORM: {
    AUTO_SAVE_DELAY: 2000, // 2 seconds
    VALIDATION_MODE: "onBlur",
    SHOW_ERRORS: true,
  },

  // Modal configuration
  MODAL: {
    ANIMATION_DURATION: 300,
    BACKDROP_CLOSE: true,
    ESCAPE_CLOSE: true,
  },

  // Toast configuration
  TOAST: {
    AUTO_HIDE_DELAY: 5000, // 5 seconds
    MAX_TOASTS: 5,
    POSITION: "top-right",
  },

  // Loading configuration
  LOADING: {
    SPINNER_SIZE: "md",
    SKELETON_ROWS: 5,
    DEBOUNCE_DELAY: 300,
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  THEME: "theme",
  LANGUAGE: "language",
  JOB_FORM_DRAFT: "jobform_draft",
  CUSTOMER_FORM_DRAFT: "customerform_draft",
  OFFLINE_ROUTES: "offline_routes",
  USER_PREFERENCES: "user_preferences",
};

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: "#3B82F6",
    SECONDARY: "#6B7280",
    SUCCESS: "#10B981",
    WARNING: "#F59E0B",
    ERROR: "#EF4444",
    INFO: "#06B6D4",
  },
  BREAKPOINTS: {
    SM: "640px",
    MD: "768px",
    LG: "1024px",
    XL: "1280px",
    "2XL": "1536px",
  },
};

// Date and Time Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  TIME: "HH:mm",
  DATETIME: "MMM dd, yyyy HH:mm",
  ISO: "yyyy-MM-ddTHH:mm:ss.SSSxxx",
};

// Export all constants
export default {
  ROUTES,
  API_ENDPOINTS,
  UI_TEXT,
  VALIDATION,
  FEATURES,
  UI_CONFIG,
  STORAGE_KEYS,
  THEME,
  DATE_FORMATS,
};
