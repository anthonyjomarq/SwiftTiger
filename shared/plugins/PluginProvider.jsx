import React, { createContext, useContext, useEffect, useState } from 'react';
import pluginManager from './PluginManager.js';
import pluginLoader from './PluginLoader.js';
import { useNotifications } from '../components/NotificationHub';

/**
 * Plugin Provider Context
 * React context for accessing the plugin system
 */

const PluginContext = createContext();

export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugins must be used within PluginProvider');
  }
  return context;
};

export const PluginProvider = ({ children, config = {} }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [plugins, setPlugins] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotifications();

  useEffect(() => {
    initializePluginSystem();
  }, []);

  const initializePluginSystem = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize plugin manager
      await pluginManager.initialize();

      // Load plugins from configuration
      if (config.autoLoad !== false) {
        await loadConfiguredPlugins();
      }

      // Update state
      setPlugins(pluginManager.getAllPlugins());
      setIsInitialized(true);

      console.log('Plugin system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize plugin system:', error);
      setError(error.message);
      showError('Plugin System Error', 'Failed to initialize plugin system');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguredPlugins = async () => {
    try {
      // Load core plugins
      const coreResults = await pluginLoader.loadPluginsFromDirectory('/core');
      console.log('Core plugins loaded:', coreResults);

      // Load feature plugins
      const featureResults = await pluginLoader.loadPluginsFromDirectory('/features');
      console.log('Feature plugins loaded:', featureResults);

      const totalLoaded = coreResults.loaded.length + featureResults.loaded.length;
      const totalFailed = coreResults.failed.length + featureResults.failed.length;

      if (totalLoaded > 0) {
        showSuccess('Plugins Loaded', `Successfully loaded ${totalLoaded} plugins`);
      }

      if (totalFailed > 0) {
        showError('Plugin Errors', `Failed to load ${totalFailed} plugins`);
      }
    } catch (error) {
      throw new Error(`Failed to load configured plugins: ${error.message}`);
    }
  };

  // Plugin management functions
  const loadPlugin = async (pluginPath) => {
    try {
      await pluginManager.loadPlugin(pluginPath);
      setPlugins(pluginManager.getAllPlugins());
      showSuccess('Plugin Loaded', 'Plugin loaded successfully');
      return true;
    } catch (error) {
      showError('Plugin Error', `Failed to load plugin: ${error.message}`);
      return false;
    }
  };

  const enablePlugin = async (pluginName) => {
    try {
      await pluginManager.enablePlugin(pluginName);
      setPlugins(pluginManager.getAllPlugins());
      showSuccess('Plugin Enabled', `Plugin ${pluginName} enabled`);
      return true;
    } catch (error) {
      showError('Plugin Error', `Failed to enable plugin: ${error.message}`);
      return false;
    }
  };

  const disablePlugin = (pluginName) => {
    try {
      pluginManager.disablePlugin(pluginName);
      setPlugins(pluginManager.getAllPlugins());
      showSuccess('Plugin Disabled', `Plugin ${pluginName} disabled`);
      return true;
    } catch (error) {
      showError('Plugin Error', `Failed to disable plugin: ${error.message}`);
      return false;
    }
  };

  const reloadPlugin = async (pluginName) => {
    try {
      await pluginLoader.hotReloadPlugin(pluginName);
      setPlugins(pluginManager.getAllPlugins());
      showSuccess('Plugin Reloaded', `Plugin ${pluginName} reloaded`);
      return true;
    } catch (error) {
      showError('Plugin Error', `Failed to reload plugin: ${error.message}`);
      return false;
    }
  };

  // Execute plugin hooks
  const executeHook = async (hookName, context = {}) => {
    try {
      return await pluginManager.executeHook(hookName, context);
    } catch (error) {
      console.error(`Hook execution failed for ${hookName}:`, error);
      return context;
    }
  };

  // Get plugin components
  const getComponent = (componentName) => {
    const componentInfo = pluginManager.getComponent(componentName);
    return componentInfo?.component;
  };

  // Get dashboard widgets
  const getDashboardWidgets = (userRole) => {
    return pluginManager.getAvailableWidgets(userRole);
  };

  // Get plugin by name
  const getPlugin = (pluginName) => {
    return pluginManager.getPlugin(pluginName);
  };

  // Check if plugin is active
  const isPluginActive = (pluginName) => {
    const plugin = getPlugin(pluginName);
    return plugin?.status === 'active';
  };

  // Get system status
  const getSystemStatus = () => {
    return {
      ...pluginManager.getStatus(),
      loadingStats: pluginLoader.getLoadingStats(),
    };
  };

  const value = {
    // State
    isInitialized,
    plugins,
    error,
    loading,

    // Plugin management
    loadPlugin,
    enablePlugin,
    disablePlugin,
    reloadPlugin,

    // Plugin access
    getPlugin,
    getComponent,
    getDashboardWidgets,
    isPluginActive,

    // System functions
    executeHook,
    getSystemStatus,

    // Managers (for advanced use)
    pluginManager,
    pluginLoader,
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
};

// Higher-order component for plugin-aware components
export const withPlugins = (Component) => {
  return React.forwardRef((props, ref) => {
    const plugins = usePlugins();
    
    return (
      <Component
        ref={ref}
        {...props}
        plugins={plugins}
      />
    );
  });
};

// Hook for using specific plugin
export const usePlugin = (pluginName) => {
  const { getPlugin, isPluginActive } = usePlugins();
  
  const plugin = getPlugin(pluginName);
  const isActive = isPluginActive(pluginName);
  
  return {
    plugin,
    isActive,
    isLoaded: !!plugin,
  };
};

// Hook for plugin components
export const usePluginComponent = (componentName) => {
  const { getComponent } = usePlugins();
  
  return getComponent(componentName);
};

// Hook for dashboard widgets
export const usePluginWidgets = (userRole) => {
  const { getDashboardWidgets } = usePlugins();
  
  return getDashboardWidgets(userRole);
};

// Hook for executing hooks
export const usePluginHooks = () => {
  const { executeHook } = usePlugins();
  
  return { executeHook };
};

export default PluginProvider;