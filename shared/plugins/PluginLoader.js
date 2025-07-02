/**
 * Plugin Loader
 * Handles dynamic loading and dependency resolution of plugins
 */

import pluginManager from './PluginManager.js';

class PluginLoader {
  constructor() {
    this.loadedPlugins = new Set();
    this.failedPlugins = new Set();
    this.loadingQueue = [];
  }

  /**
   * Load plugins from directory
   */
  async loadPluginsFromDirectory(directory, options = {}) {
    const { 
      pattern = '**/*.js',
      ignore = ['**/node_modules/**'],
      recursive = true 
    } = options;

    try {
      // In a real implementation, you would scan the filesystem
      // For now, we'll use a predefined list of plugins
      const availablePlugins = this.getAvailablePlugins(directory);
      
      console.log(`Found ${availablePlugins.length} plugins in ${directory}`);
      
      // Load plugins with dependency resolution
      return await this.loadPluginsWithDependencies(availablePlugins);
      
    } catch (error) {
      console.error('Failed to load plugins from directory:', error);
      throw error;
    }
  }

  /**
   * Get available plugins (mock implementation)
   */
  getAvailablePlugins(directory) {
    const plugins = {
      '/core': [
        { path: './core/NotificationPlugin.js', name: 'notification', priority: 10 },
        { path: './core/AuthPlugin.js', name: 'auth', priority: 5 },
        { path: './core/AnalyticsPlugin.js', name: 'analytics', priority: 15 },
      ],
      '/features': [
        { path: './features/InventoryPlugin.js', name: 'inventory', priority: 50 },
        { path: './features/BillingPlugin.js', name: 'billing', priority: 60 },
        { path: './features/ReportingPlugin.js', name: 'reporting', priority: 70 },
      ],
    };

    return plugins[directory] || [];
  }

  /**
   * Load plugins with dependency resolution
   */
  async loadPluginsWithDependencies(pluginList) {
    const results = {
      loaded: [],
      failed: [],
      skipped: [],
    };

    // Sort by priority (lower number = higher priority)
    const sortedPlugins = [...pluginList].sort((a, b) => (a.priority || 100) - (b.priority || 100));
    
    // Build dependency graph
    const dependencyGraph = await this.buildDependencyGraph(sortedPlugins);
    
    // Load plugins in dependency order
    const loadOrder = this.resolveDependencyOrder(dependencyGraph);
    
    for (const pluginInfo of loadOrder) {
      try {
        await this.loadSinglePlugin(pluginInfo);
        results.loaded.push(pluginInfo.name);
        this.loadedPlugins.add(pluginInfo.name);
      } catch (error) {
        console.error(`Failed to load plugin ${pluginInfo.name}:`, error);
        results.failed.push({ name: pluginInfo.name, error: error.message });
        this.failedPlugins.add(pluginInfo.name);
      }
    }

    return results;
  }

  /**
   * Build dependency graph
   */
  async buildDependencyGraph(pluginList) {
    const graph = new Map();

    for (const pluginInfo of pluginList) {
      try {
        // Load plugin metadata without initializing
        const plugin = await this.loadPluginMetadata(pluginInfo.path);
        
        graph.set(plugin.name, {
          ...pluginInfo,
          plugin,
          dependencies: plugin.dependencies || [],
        });
      } catch (error) {
        console.warn(`Failed to load metadata for ${pluginInfo.name}:`, error.message);
      }
    }

    return graph;
  }

  /**
   * Load plugin metadata only
   */
  async loadPluginMetadata(pluginPath) {
    try {
      const pluginModule = await import(pluginPath);
      const plugin = pluginModule.default || pluginModule;
      
      // Validate basic structure
      if (!plugin.name || !plugin.version) {
        throw new Error('Plugin must have name and version');
      }
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin metadata: ${error.message}`);
    }
  }

  /**
   * Resolve dependency order using topological sort
   */
  resolveDependencyOrder(dependencyGraph) {
    const visited = new Set();
    const visiting = new Set();
    const sorted = [];

    const visit = (pluginName) => {
      if (visited.has(pluginName)) return;
      if (visiting.has(pluginName)) {
        throw new Error(`Circular dependency detected involving ${pluginName}`);
      }

      const pluginInfo = dependencyGraph.get(pluginName);
      if (!pluginInfo) {
        throw new Error(`Plugin ${pluginName} not found in dependency graph`);
      }

      visiting.add(pluginName);

      // Visit dependencies first
      for (const depName of pluginInfo.dependencies) {
        visit(depName);
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      sorted.push(pluginInfo);
    };

    // Visit all plugins
    for (const pluginName of dependencyGraph.keys()) {
      visit(pluginName);
    }

    return sorted;
  }

  /**
   * Load a single plugin
   */
  async loadSinglePlugin(pluginInfo) {
    // Check if dependencies are loaded
    const missingDeps = pluginInfo.dependencies.filter(dep => 
      !this.loadedPlugins.has(dep) && !this.isCoreDependency(dep)
    );

    if (missingDeps.length > 0) {
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }

    // Load and register the plugin
    await pluginManager.loadPlugin(pluginInfo.path);
    
    console.log(`Successfully loaded plugin: ${pluginInfo.name}`);
  }

  /**
   * Check if dependency is a core system dependency
   */
  isCoreDependency(depName) {
    const coreDependencies = ['express', 'react', 'database'];
    return coreDependencies.includes(depName);
  }

  /**
   * Hot reload a plugin
   */
  async hotReloadPlugin(pluginName) {
    try {
      // Disable existing plugin
      pluginManager.disablePlugin(pluginName);
      
      // Clear from loaded set
      this.loadedPlugins.delete(pluginName);
      
      // Clear module cache (Node.js specific)
      if (typeof require !== 'undefined' && require.cache) {
        const pluginPath = this.getPluginPath(pluginName);
        if (pluginPath && require.cache[pluginPath]) {
          delete require.cache[pluginPath];
        }
      }
      
      // Reload plugin
      const pluginInfo = { name: pluginName, path: this.getPluginPath(pluginName) };
      await this.loadSinglePlugin(pluginInfo);
      
      console.log(`Hot reloaded plugin: ${pluginName}`);
      return true;
    } catch (error) {
      console.error(`Failed to hot reload plugin ${pluginName}:`, error);
      return false;
    }
  }

  /**
   * Get plugin path by name
   */
  getPluginPath(pluginName) {
    // This would typically be stored during initial loading
    // For now, return a mock path
    const corePlugins = {
      'auth': './core/AuthPlugin.js',
      'notification': './core/NotificationPlugin.js',
      'analytics': './core/AnalyticsPlugin.js',
    };
    
    const featurePlugins = {
      'inventory': './features/InventoryPlugin.js',
      'billing': './features/BillingPlugin.js',
      'reporting': './features/ReportingPlugin.js',
    };
    
    return corePlugins[pluginName] || featurePlugins[pluginName];
  }

  /**
   * Validate plugin before loading
   */
  async validatePlugin(pluginPath) {
    try {
      const plugin = await this.loadPluginMetadata(pluginPath);
      
      // Check required fields
      const requiredFields = ['name', 'version', 'description'];
      for (const field of requiredFields) {
        if (!plugin[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validate version format
      if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
        throw new Error('Version must be in semver format');
      }
      
      // Check for naming conflicts
      if (pluginManager.getPlugin(plugin.name)) {
        throw new Error(`Plugin name '${plugin.name}' already exists`);
      }
      
      // Validate dependencies
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.loadedPlugins.has(dep) && !this.isCoreDependency(dep)) {
            console.warn(`Unresolved dependency: ${dep}`);
          }
        }
      }
      
      return { valid: true, plugin };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get loading statistics
   */
  getLoadingStats() {
    return {
      loaded: Array.from(this.loadedPlugins),
      failed: Array.from(this.failedPlugins),
      total: this.loadedPlugins.size + this.failedPlugins.size,
      successRate: this.loadedPlugins.size / (this.loadedPlugins.size + this.failedPlugins.size) * 100,
    };
  }

  /**
   * Load plugin configuration from file
   */
  async loadPluginConfig(configPath) {
    try {
      // In a real implementation, load from filesystem
      const defaultConfig = {
        autoLoad: true,
        corePlugins: ['auth', 'notification'],
        featurePlugins: {
          inventory: { enabled: true, config: {} },
          billing: { enabled: false, config: {} },
          reporting: { enabled: true, config: {} },
        },
        loadingOptions: {
          maxRetries: 3,
          retryDelay: 1000,
          failSafe: true,
        },
      };
      
      return defaultConfig;
    } catch (error) {
      console.error('Failed to load plugin configuration:', error);
      return {};
    }
  }

  /**
   * Save plugin configuration
   */
  async savePluginConfig(config, configPath) {
    try {
      // In a real implementation, save to filesystem
      console.log('Saving plugin configuration:', config);
      return true;
    } catch (error) {
      console.error('Failed to save plugin configuration:', error);
      return false;
    }
  }

  /**
   * Install plugin from package
   */
  async installPlugin(packagePath, options = {}) {
    const { validate = true, autoLoad = true } = options;
    
    try {
      // Validate plugin package
      if (validate) {
        const validation = await this.validatePlugin(packagePath);
        if (!validation.valid) {
          throw new Error(`Plugin validation failed: ${validation.error}`);
        }
      }
      
      // Copy plugin to plugins directory (in real implementation)
      console.log(`Installing plugin from ${packagePath}`);
      
      // Load plugin if autoLoad is enabled
      if (autoLoad) {
        await this.loadSinglePlugin({ path: packagePath });
      }
      
      return { success: true, message: 'Plugin installed successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(pluginName) {
    try {
      // Disable plugin
      pluginManager.disablePlugin(pluginName);
      
      // Remove from loaded set
      this.loadedPlugins.delete(pluginName);
      
      // In real implementation, remove plugin files
      console.log(`Uninstalled plugin: ${pluginName}`);
      
      return { success: true, message: 'Plugin uninstalled successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const pluginLoader = new PluginLoader();

export default pluginLoader;