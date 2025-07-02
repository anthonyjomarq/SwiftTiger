import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCapabilityMatrix, getOptimizationSettings, getResponsiveConfig } from '../utils/device';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Responsive Provider Context
 * Provides device capabilities and responsive utilities throughout the app
 */

const ResponsiveContext = createContext();

export const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within ResponsiveProvider');
  }
  return context;
};

export const ResponsiveProvider = ({ children }) => {
  const [capabilities, setCapabilities] = useState(null);
  const [optimizations, setOptimizations] = useState(null);
  const [config, setConfig] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const responsive = useResponsive();

  useEffect(() => {
    // Initialize device detection
    const initializeDevice = () => {
      const caps = getCapabilityMatrix();
      const opts = getOptimizationSettings();
      const conf = getResponsiveConfig();
      
      setCapabilities(caps);
      setOptimizations(opts);
      setConfig(conf);
      setIsInitialized(true);
      
      // Apply initial optimizations
      applyOptimizations(opts, caps);
    };

    initializeDevice();
  }, []);

  // Apply device-specific optimizations
  const applyOptimizations = (opts, caps) => {
    // Disable animations on low-end devices
    if (!opts.enableAnimations) {
      document.documentElement.style.setProperty('--st-animation-duration', '0ms');
    }
    
    // Set animation duration
    document.documentElement.style.setProperty(
      '--st-animation-duration-fast', 
      `${Math.max(opts.animationDuration * 0.5, 100)}ms`
    );
    document.documentElement.style.setProperty(
      '--st-animation-duration-normal', 
      `${opts.animationDuration}ms`
    );
    document.documentElement.style.setProperty(
      '--st-animation-duration-slow', 
      `${opts.animationDuration * 2}ms`
    );
    
    // Set touch target sizes
    if (caps.features.touchEvents) {
      document.documentElement.style.setProperty('--st-touch-target', '44px');
      document.documentElement.style.setProperty('--st-touch-target-small', '36px');
    }
    
    // Apply high DPI optimizations
    if (caps.performance.devicePixelRatio > 2) {
      document.documentElement.classList.add('high-dpi');
    }
    
    // Apply device type classes
    document.documentElement.classList.add(
      caps.device.isMobile ? 'device-mobile' : 
      caps.device.isTablet ? 'device-tablet' : 'device-desktop'
    );
    
    // Apply capability classes
    if (caps.features.touchEvents) {
      document.documentElement.classList.add('touch-enabled');
    }
    
    if (caps.canInstallPWA) {
      document.documentElement.classList.add('pwa-capable');
    }
  };

  // Responsive utility functions
  const getLayoutVariant = () => {
    if (responsive.isMobile) return 'mobile';
    if (responsive.isTablet) return 'tablet';
    return 'desktop';
  };

  const shouldShowFeature = (feature) => {
    if (!capabilities || !optimizations) return true;
    
    switch (feature) {
      case 'animations':
        return optimizations.enableAnimations;
      case 'advancedFeatures':
        return optimizations.showAdvancedFeatures;
      case 'realTimeUpdates':
        return optimizations.enableRealTimeUpdates;
      case 'pushNotifications':
        return capabilities.canUsePushNotifications;
      case 'camera':
        return capabilities.canUseCamera;
      case 'geolocation':
        return capabilities.canUseGeolocation;
      case 'vibration':
        return capabilities.canUseVibration;
      default:
        return true;
    }
  };

  const getComponentSize = () => {
    if (!config) return 'md';
    return config.componentSize === 'compact' ? 'sm' : 'md';
  };

  const getTouchTargetSize = () => {
    if (!config) return 44;
    return config.touchTargetSize;
  };

  const getImageQuality = () => {
    if (!optimizations) return 'medium';
    return optimizations.imageQuality;
  };

  const shouldLazyLoad = () => {
    if (!optimizations) return true;
    return optimizations.lazyLoadImages;
  };

  const getMaxConcurrentRequests = () => {
    if (!optimizations) return 6;
    return optimizations.maxConcurrentRequests;
  };

  const isLowEndDevice = () => {
    if (!capabilities) return false;
    return capabilities.isLowEndDevice;
  };

  const isSlowNetwork = () => {
    if (!capabilities) return false;
    return capabilities.isSlowNetwork;
  };

  const getNavigationStyle = () => {
    if (!config) return 'sidebar';
    return config.navigationStyle;
  };

  const getContentDensity = () => {
    if (!config) return 'normal';
    return config.contentDensity;
  };

  const getSpacing = () => {
    if (!config) return 'normal';
    return config.spacing;
  };

  // Device-specific component props
  const getCardProps = () => ({
    variant: responsive.isMobile ? 'default' : 'elevated',
    padding: getSpacing() === 'tight' ? 'sm' : 'md',
    interactive: capabilities?.features.touchEvents || false,
  });

  const getButtonProps = () => ({
    size: getComponentSize(),
    className: capabilities?.features.touchEvents ? 'touch-target' : '',
  });

  const getInputProps = () => ({
    size: getComponentSize(),
    className: responsive.isMobile ? 'mobile-input' : '',
  });

  const getLayoutProps = () => ({
    variant: getLayoutVariant(),
    spacing: getSpacing(),
    density: getContentDensity(),
  });

  const value = {
    // Core data
    capabilities,
    optimizations,
    config,
    responsive,
    isInitialized,
    
    // Utility functions
    getLayoutVariant,
    shouldShowFeature,
    getComponentSize,
    getTouchTargetSize,
    getImageQuality,
    shouldLazyLoad,
    getMaxConcurrentRequests,
    isLowEndDevice,
    isSlowNetwork,
    getNavigationStyle,
    getContentDensity,
    getSpacing,
    
    // Component helpers
    getCardProps,
    getButtonProps,
    getInputProps,
    getLayoutProps,
  };

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-st-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Higher-order component for responsive features
export const withResponsive = (Component) => {
  return React.forwardRef((props, ref) => {
    const responsive = useResponsiveContext();
    
    return (
      <Component
        ref={ref}
        {...props}
        responsive={responsive}
      />
    );
  });
};

// Hook for responsive component props
export const useResponsiveProps = (componentType) => {
  const responsive = useResponsiveContext();
  
  switch (componentType) {
    case 'card':
      return responsive.getCardProps();
    case 'button':
      return responsive.getButtonProps();
    case 'input':
      return responsive.getInputProps();
    case 'layout':
      return responsive.getLayoutProps();
    default:
      return {};
  }
};

export default ResponsiveProvider;