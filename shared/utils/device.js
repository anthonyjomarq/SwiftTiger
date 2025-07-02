/**
 * Device Detection and Capability Utilities
 * Cross-platform device detection and feature support
 */

// Device Detection
export const detectDevice = () => {
  const userAgent = navigator.userAgent;
  
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isMobile = /Mobi|Android/i.test(userAgent);
  const isTablet = /Tablet|iPad/.test(userAgent) || (isAndroid && !/Mobile/.test(userAgent));
  const isDesktop = !isMobile && !isTablet;
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edge/.test(userAgent);
  
  return {
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    userAgent,
  };
};

// Feature Detection
export const detectFeatures = () => {
  const features = {
    // Storage
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    indexedDB: 'indexedDB' in window,
    
    // Network
    onlineStatus: 'navigator' in window && 'onLine' in navigator,
    networkInformation: 'connection' in navigator,
    
    // Hardware
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    accelerometer: 'DeviceMotionEvent' in window,
    gyroscope: 'DeviceOrientationEvent' in window,
    battery: 'getBattery' in navigator,
    vibration: 'vibrate' in navigator,
    
    // PWA
    serviceWorker: 'serviceWorker' in navigator,
    webManifest: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    
    // Display
    fullscreen: 'requestFullscreen' in document.documentElement,
    screenOrientation: 'screen' in window && 'orientation' in window.screen,
    wakeLock: 'wakeLock' in navigator,
    
    // Input
    touchEvents: 'ontouchstart' in window,
    pointerEvents: 'onpointerdown' in window,
    devicePixelRatio: 'devicePixelRatio' in window,
    
    // Web APIs
    webRTC: 'RTCPeerConnection' in window,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })(),
    webAssembly: 'WebAssembly' in window,
    webWorkers: 'Worker' in window,
    
    // Payment
    paymentRequest: 'PaymentRequest' in window,
    
    // Sharing
    webShare: 'share' in navigator,
    
    // Audio/Video
    mediaRecorder: 'MediaRecorder' in window,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
  };
  
  return features;
};

// Performance Detection
export const detectPerformance = () => {
  const performance = {
    memory: 'memory' in performance ? performance.memory : null,
    hardwareConcurrency: 'hardwareConcurrency' in navigator ? navigator.hardwareConcurrency : 1,
    maxTouchPoints: 'maxTouchPoints' in navigator ? navigator.maxTouchPoints : 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
    downlink: navigator.connection ? navigator.connection.downlink : null,
    rtt: navigator.connection ? navigator.connection.rtt : null,
  };
  
  return performance;
};

// Capability Matrix
export const getCapabilityMatrix = () => {
  const device = detectDevice();
  const features = detectFeatures();
  const performance = detectPerformance();
  
  return {
    device,
    features,
    performance,
    
    // Computed capabilities
    canInstallPWA: features.serviceWorker && features.webManifest,
    canUseCamera: features.camera && (device.isMobile || device.isTablet),
    canUseGeolocation: features.geolocation,
    canUsePushNotifications: features.pushNotifications && features.serviceWorker,
    canUseBackgroundSync: features.backgroundSync,
    canUseOfflineStorage: features.localStorage && features.indexedDB,
    canUseWebRTC: features.webRTC,
    canUsePayments: features.paymentRequest,
    canUseSharing: features.webShare,
    canUseFullscreen: features.fullscreen,
    canUseVibration: features.vibration && device.isMobile,
    canUseBiometrics: device.isIOS || device.isAndroid,
    
    // Performance indicators
    isLowEndDevice: performance.hardwareConcurrency <= 2 && performance.memory && performance.memory.totalJSHeapSize < 100 * 1024 * 1024,
    isSlowNetwork: performance.connectionType === 'slow-2g' || performance.connectionType === '2g',
    isHighDPI: performance.devicePixelRatio > 1.5,
  };
};

// Device-specific optimizations
export const getOptimizationSettings = () => {
  const capabilities = getCapabilityMatrix();
  
  return {
    // Animation settings
    enableAnimations: !capabilities.isLowEndDevice && !capabilities.isSlowNetwork,
    animationDuration: capabilities.isLowEndDevice ? 150 : 300,
    
    // Image settings
    imageQuality: capabilities.isSlowNetwork ? 'low' : capabilities.isHighDPI ? 'high' : 'medium',
    lazyLoadImages: capabilities.isSlowNetwork || capabilities.isLowEndDevice,
    
    // Caching settings
    cacheStrategy: capabilities.features.localStorage ? 'aggressive' : 'minimal',
    prefetchResources: !capabilities.isSlowNetwork && !capabilities.isLowEndDevice,
    
    // UI settings
    showAdvancedFeatures: !capabilities.isLowEndDevice,
    enableRealTimeUpdates: !capabilities.isSlowNetwork,
    maxConcurrentRequests: capabilities.isSlowNetwork ? 2 : 6,
    
    // PWA settings
    enablePWAFeatures: capabilities.canInstallPWA,
    enablePushNotifications: capabilities.canUsePushNotifications,
    enableBackgroundSync: capabilities.canUseBackgroundSync,
    
    // Input settings
    touchOptimized: capabilities.device.isMobile || capabilities.device.isTablet,
    gesturesEnabled: capabilities.features.touchEvents,
    
    // Battery optimizations
    reducedMotion: capabilities.isLowEndDevice,
    backgroundProcessing: !capabilities.isLowEndDevice,
  };
};

// Responsive breakpoint utilities
export const getResponsiveConfig = () => {
  const capabilities = getCapabilityMatrix();
  
  return {
    // Layout preferences
    preferredLayout: capabilities.device.isMobile ? 'mobile' : 
                     capabilities.device.isTablet ? 'tablet' : 'desktop',
    
    // Component sizing
    componentSize: capabilities.device.isMobile ? 'compact' : 'comfortable',
    
    // Navigation style
    navigationStyle: capabilities.device.isMobile ? 'bottom-tabs' : 'sidebar',
    
    // Content density
    contentDensity: capabilities.performance.screenSize.height < 800 ? 'dense' : 'normal',
    
    // Touch targets
    touchTargetSize: capabilities.features.touchEvents ? 44 : 32,
    
    // Spacing
    spacing: capabilities.device.isMobile ? 'tight' : 'normal',
  };
};

// Utility functions
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

export const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const isAndroidDevice = () => {
  return /Android/.test(navigator.userAgent);
};

export const isMobileDevice = () => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

export const isPortrait = () => {
  return window.innerHeight > window.innerWidth;
};

export const getScreenSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
  };
};

export const getDeviceOrientation = () => {
  if (window.screen && window.screen.orientation) {
    return window.screen.orientation.angle;
  }
  return window.orientation || 0;
};

// Export main detection function
export default getCapabilityMatrix;