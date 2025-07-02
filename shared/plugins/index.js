/**
 * Plugin System Exports
 * Main entry point for the SwiftTiger plugin architecture
 */

// Core plugin system
export { default as PluginManager } from './PluginManager.js';
export { default as PluginLoader } from './PluginLoader.js';

// React integration
export { 
  default as PluginProvider,
  usePlugins,
  usePlugin,
  usePluginComponent,
  usePluginWidgets,
  usePluginHooks,
  withPlugins
} from './PluginProvider.jsx';

// Core plugins
export { default as NotificationPlugin } from './core/NotificationPlugin.js';
export { default as AuthPlugin } from './core/AuthPlugin.js';

// Feature plugins
export { default as InventoryPlugin } from './features/InventoryPlugin.js';

// Plugin utilities
export const createPlugin = (config) => {
  const {
    name,
    version,
    description,
    author,
    dependencies = [],
    priority = 100,
    initialize,
    hooks = {},
    middleware = [],
    routes = [],
    components = {},
    dashboardWidgets = {},
    apiEndpoints = [],
  } = config;

  if (!name || !version) {
    throw new Error('Plugin must have name and version');
  }

  return {
    name,
    version,
    description,
    author,
    dependencies,
    priority,
    initialize,
    hooks,
    middleware,
    routes,
    components,
    dashboardWidgets,
    apiEndpoints,
  };
};

// Plugin development utilities
export const PluginUtils = {
  // Validate plugin structure
  validatePlugin: (plugin) => {
    const required = ['name', 'version'];
    for (const field of required) {
      if (!plugin[field]) {
        throw new Error(`Plugin missing required field: ${field}`);
      }
    }
    
    if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
      throw new Error('Plugin version must be in semver format');
    }
    
    return true;
  },

  // Generate plugin template
  generatePluginTemplate: (name, type = 'feature') => {
    const template = {
      name,
      version: '1.0.0',
      description: `${name} plugin for SwiftTiger`,
      author: 'SwiftTiger',
      priority: type === 'core' ? 10 : 50,
      
      async initialize(pluginManager) {
        console.log(`Initializing ${name} plugin...`);
        return true;
      },
      
      hooks: {
        // Add your hooks here
      },
      
      apiEndpoints: [
        // Add your API endpoints here
      ],
      
      dashboardWidgets: {
        // Add your dashboard widgets here
      },
      
      components: {
        // Add your React components here
      },
    };
    
    return template;
  },

  // Plugin lifecycle helpers
  createLifecycleHooks: () => ({
    beforeInitialize: async (context) => context,
    afterInitialize: async (context) => context,
    beforeDestroy: async (context) => context,
    afterDestroy: async (context) => context,
  }),

  // API endpoint helpers
  createAPIEndpoint: (method, path, handler, options = {}) => ({
    method: method.toUpperCase(),
    path,
    handler,
    middleware: options.middleware || [],
    auth: options.auth !== false,
    roles: options.roles || [],
  }),

  // Dashboard widget helpers
  createDashboardWidget: (name, type, config = {}) => ({
    name,
    type,
    roles: config.roles || ['admin'],
    fetchData: config.fetchData || (() => ({})),
    refreshInterval: config.refreshInterval || 60000,
    size: config.size || 'medium',
  }),

  // Hook helpers
  createHook: (name, handler, priority = 100) => ({
    [name]: handler,
    priority,
  }),
};

// Plugin development constants
export const PLUGIN_TYPES = {
  CORE: 'core',
  FEATURE: 'feature',
  INTEGRATION: 'integration',
  THEME: 'theme',
};

export const PLUGIN_STATUS = {
  REGISTERED: 'registered',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  ERROR: 'error',
};

export const HOOK_TYPES = {
  // System hooks
  SYSTEM_STARTUP: 'system:startup',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_ALERT: 'system:alert',
  
  // User hooks
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_REGISTER: 'user:register',
  USER_UPDATE: 'user:update',
  
  // Job hooks
  JOB_CREATED: 'job:created',
  JOB_UPDATED: 'job:updated',
  JOB_DELETED: 'job:deleted',
  JOB_ASSIGNED: 'job:assigned',
  JOB_STATUS_CHANGED: 'job:status_changed',
  JOB_COMPLETED: 'job:completed',
  
  // API hooks
  API_REQUEST: 'api:request',
  API_RESPONSE: 'api:response',
  API_ERROR: 'api:error',
  
  // Authorization hooks
  AUTH_REQUIRED: 'auth:required',
  AUTH_FAILED: 'auth:failed',
  PERMISSION_CHECK: 'permission:check',
  
  // Notification hooks
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_READ: 'notification:read',
  
  // Custom hooks
  CUSTOM: 'custom',
};

// Re-export types for convenience
export * from '../types/index.js';