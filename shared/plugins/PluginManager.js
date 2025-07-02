/**
 * Plugin Manager
 * Core system for loading, managing, and executing plugins
 */

import { USER_ROLES, FEATURE_FLAGS } from '../types/index.js';

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.middleware = [];
    this.routes = new Map();
    this.components = new Map();
    this.dashboardWidgets = new Map();
    this.apiEndpoints = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load core plugins first
      await this.loadCorePlugins();
      
      // Load feature plugins based on flags
      await this.loadFeaturePlugins();
      
      // Initialize all loaded plugins
      await this.initializePlugins();
      
      this.isInitialized = true;
      console.log('Plugin Manager initialized successfully');
    } catch (error) {
      console.error('Plugin Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin) {
    if (!plugin.name || !plugin.version) {
      throw new Error('Plugin must have name and version');
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already registered, updating...`);
    }

    // Validate plugin structure
    this.validatePlugin(plugin);

    // Store plugin
    this.plugins.set(plugin.name, {
      ...plugin,
      status: 'registered',
      registeredAt: new Date(),
    });

    console.log(`Plugin ${plugin.name} v${plugin.version} registered`);
    return true;
  }

  /**
   * Load a plugin dynamically
   */
  async loadPlugin(pluginPath) {
    try {
      const pluginModule = await import(pluginPath);
      const plugin = pluginModule.default || pluginModule;
      
      this.registerPlugin(plugin);
      
      if (this.isInitialized) {
        await this.initializePlugin(plugin.name);
      }
      
      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  /**
   * Initialize a specific plugin
   */
  async initializePlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    try {
      // Check dependencies
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            throw new Error(`Missing dependency: ${dep}`);
          }
        }
      }

      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize(this);
      }

      // Register hooks
      if (plugin.hooks) {
        this.registerPluginHooks(pluginName, plugin.hooks);
      }

      // Register middleware
      if (plugin.middleware) {
        this.registerPluginMiddleware(pluginName, plugin.middleware);
      }

      // Register routes
      if (plugin.routes) {
        this.registerPluginRoutes(pluginName, plugin.routes);
      }

      // Register components
      if (plugin.components) {
        this.registerPluginComponents(pluginName, plugin.components);
      }

      // Register dashboard widgets
      if (plugin.dashboardWidgets) {
        this.registerPluginWidgets(pluginName, plugin.dashboardWidgets);
      }

      // Register API endpoints
      if (plugin.apiEndpoints) {
        this.registerPluginAPI(pluginName, plugin.apiEndpoints);
      }

      plugin.status = 'active';
      plugin.initializedAt = new Date();
      
      console.log(`Plugin ${pluginName} initialized successfully`);
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error.message;
      console.error(`Failed to initialize plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Load core plugins
   */
  async loadCorePlugins() {
    const corePlugins = [
      './core/NotificationPlugin.js',
      './core/AuthPlugin.js',
      './core/AnalyticsPlugin.js',
    ];

    for (const pluginPath of corePlugins) {
      try {
        await this.loadPlugin(pluginPath);
      } catch (error) {
        console.warn(`Core plugin ${pluginPath} failed to load:`, error.message);
      }
    }
  }

  /**
   * Load feature plugins based on feature flags
   */
  async loadFeaturePlugins() {
    const featurePlugins = {
      INVENTORY_MANAGEMENT: './features/InventoryPlugin.js',
      BILLING_INTEGRATION: './features/BillingPlugin.js',
      ADVANCED_REPORTING: './features/ReportingPlugin.js',
      ROUTE_OPTIMIZATION: './features/RouteOptimizationPlugin.js',
      CUSTOMER_PORTAL: './features/CustomerPortalPlugin.js',
    };

    for (const [flag, pluginPath] of Object.entries(featurePlugins)) {
      if (FEATURE_FLAGS[flag]) {
        try {
          await this.loadPlugin(pluginPath);
        } catch (error) {
          console.warn(`Feature plugin ${pluginPath} failed to load:`, error.message);
        }
      }
    }
  }

  /**
   * Initialize all registered plugins
   */
  async initializePlugins() {
    const plugins = Array.from(this.plugins.values());
    
    // Sort by priority (lower number = higher priority)
    plugins.sort((a, b) => (a.priority || 100) - (b.priority || 100));

    for (const plugin of plugins) {
      if (plugin.status === 'registered') {
        try {
          await this.initializePlugin(plugin.name);
        } catch (error) {
          console.error(`Failed to initialize ${plugin.name}:`, error);
        }
      }
    }
  }

  /**
   * Execute hooks
   */
  async executeHook(hookName, context = {}) {
    const hooks = this.hooks.get(hookName) || [];
    let result = context;

    for (const hook of hooks) {
      try {
        const hookResult = await hook.handler(result, context);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Hook ${hookName} from ${hook.plugin} failed:`, error);
      }
    }

    return result;
  }

  /**
   * Register plugin hooks
   */
  registerPluginHooks(pluginName, hooks) {
    for (const [hookName, handler] of Object.entries(hooks)) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }
      
      this.hooks.get(hookName).push({
        plugin: pluginName,
        handler,
      });
    }
  }

  /**
   * Register plugin middleware
   */
  registerPluginMiddleware(pluginName, middleware) {
    if (Array.isArray(middleware)) {
      for (const mw of middleware) {
        this.middleware.push({ plugin: pluginName, middleware: mw });
      }
    } else {
      this.middleware.push({ plugin: pluginName, middleware });
    }
  }

  /**
   * Register plugin routes
   */
  registerPluginRoutes(pluginName, routes) {
    for (const route of routes) {
      const key = `${route.method}:${route.path}`;
      this.routes.set(key, {
        plugin: pluginName,
        ...route,
      });
    }
  }

  /**
   * Register plugin components
   */
  registerPluginComponents(pluginName, components) {
    for (const [name, component] of Object.entries(components)) {
      this.components.set(name, {
        plugin: pluginName,
        component,
      });
    }
  }

  /**
   * Register plugin dashboard widgets
   */
  registerPluginWidgets(pluginName, widgets) {
    for (const [name, widget] of Object.entries(widgets)) {
      this.dashboardWidgets.set(name, {
        plugin: pluginName,
        widget,
      });
    }
  }

  /**
   * Register plugin API endpoints
   */
  registerPluginAPI(pluginName, endpoints) {
    for (const endpoint of endpoints) {
      const key = `${endpoint.method}:${endpoint.path}`;
      this.apiEndpoints.set(key, {
        plugin: pluginName,
        ...endpoint,
      });
    }
  }

  /**
   * Get plugin by name
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins() {
    return this.getAllPlugins().filter(plugin => plugin.status === 'active');
  }

  /**
   * Get plugin component
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Get plugin dashboard widget
   */
  getDashboardWidget(name) {
    return this.dashboardWidgets.get(name);
  }

  /**
   * Get available dashboard widgets for user role
   */
  getAvailableWidgets(userRole) {
    const widgets = [];
    
    for (const [name, widget] of this.dashboardWidgets) {
      if (!widget.widget.roles || widget.widget.roles.includes(userRole)) {
        widgets.push({
          name,
          ...widget.widget,
        });
      }
    }
    
    return widgets;
  }

  /**
   * Get plugin routes
   */
  getRoutes() {
    return Array.from(this.routes.values());
  }

  /**
   * Get plugin API endpoints
   */
  getAPIEndpoints() {
    return Array.from(this.apiEndpoints.values());
  }

  /**
   * Disable plugin
   */
  disablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.status = 'disabled';
      
      // TODO: Remove hooks, routes, components, etc.
      console.log(`Plugin ${name} disabled`);
    }
  }

  /**
   * Enable plugin
   */
  async enablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.status === 'disabled') {
      await this.initializePlugin(name);
    }
  }

  /**
   * Validate plugin structure
   */
  validatePlugin(plugin) {
    const required = ['name', 'version'];
    const optional = [
      'description', 'author', 'dependencies', 'priority',
      'initialize', 'hooks', 'middleware', 'routes', 
      'components', 'dashboardWidgets', 'apiEndpoints'
    ];

    for (const field of required) {
      if (!plugin[field]) {
        throw new Error(`Plugin missing required field: ${field}`);
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
      throw new Error('Plugin version must be in semver format (x.y.z)');
    }

    return true;
  }

  /**
   * Get plugin system status
   */
  getStatus() {
    const plugins = this.getAllPlugins();
    
    return {
      initialized: this.isInitialized,
      totalPlugins: plugins.length,
      activePlugins: plugins.filter(p => p.status === 'active').length,
      errorPlugins: plugins.filter(p => p.status === 'error').length,
      hooks: this.hooks.size,
      routes: this.routes.size,
      components: this.components.size,
      dashboardWidgets: this.dashboardWidgets.size,
      apiEndpoints: this.apiEndpoints.size,
    };
  }
}

// Create singleton instance
const pluginManager = new PluginManager();

export default pluginManager;