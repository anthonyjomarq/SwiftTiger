import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

/**
 * Progressive Web App Setup Components
 * Handles PWA installation, offline support, and app-like features
 */

// PWA Installation Prompt
export const PWAInstallPrompt = ({ 
  onInstall, 
  onDismiss,
  className,
  ...props 
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);

    if (outcome === 'accepted') {
      onInstall?.();
    } else {
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    onDismiss?.();
  };

  if (!showInstallPrompt) return null;

  return (
    <div 
      className={cn(
        'fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg border border-st-border-primary',
        'p-4 z-50 mobile-fade-in',
        className
      )}
      {...props}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-st-primary-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-st-text-primary">
            Install SwiftTiger
          </h3>
          <p className="text-xs text-st-text-secondary mt-1">
            Add to your home screen for quick access and offline use
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-st-text-tertiary hover:text-st-text-secondary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 bg-st-primary-500 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-st-primary-600 transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
};

// Offline Status Indicator
export const OfflineIndicator = ({ className, ...props }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div 
      className={cn(
        'fixed top-0 left-0 right-0 bg-st-warning-500 text-white text-center py-2 px-4 text-sm z-50',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>You're offline. Some features may not be available.</span>
      </div>
    </div>
  );
};

// App Update Available Banner
export const UpdateAvailableBanner = ({ 
  onUpdate, 
  onDismiss,
  className,
  ...props 
}) => {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(registration.waiting);
              setShowUpdateBanner(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateBanner(false);
    onUpdate?.();
  };

  const handleDismiss = () => {
    setShowUpdateBanner(false);
    onDismiss?.();
  };

  if (!showUpdateBanner) return null;

  return (
    <div 
      className={cn(
        'fixed top-0 left-0 right-0 bg-st-info-500 text-white p-4 z-50',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div>
            <p className="text-sm font-medium">App Update Available</p>
            <p className="text-xs opacity-90">Restart to get the latest features</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-st-info-500 text-sm font-medium py-1 px-3 rounded hover:bg-gray-100 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// PWA Status Bar (shows network, battery, etc.)
export const PWAStatusBar = ({ 
  showTime = true,
  showBattery = true,
  showNetwork = true,
  className,
  ...props 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Battery API (if supported)
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const updateBatteryInfo = () => {
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging,
          });
        };
        
        updateBatteryInfo();
        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);
      });
    }

    // Network API (if supported)
    if ('connection' in navigator) {
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
        });
      };
      
      updateNetworkInfo();
      navigator.connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div 
      className={cn(
        'flex items-center justify-between text-xs text-st-text-secondary px-4 py-1',
        'bg-st-gray-50 border-b border-st-border-primary',
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-4">
        {showTime && (
          <span className="font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        
        {showNetwork && networkInfo && (
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
            <span>{networkInfo.effectiveType}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {showBattery && batteryInfo && (
          <div className="flex items-center space-x-1">
            <div className={cn(
              'w-6 h-3 border border-current rounded-sm relative',
              batteryInfo.level < 20 && 'text-st-error-500',
              batteryInfo.level < 50 && batteryInfo.level >= 20 && 'text-st-warning-500',
              batteryInfo.level >= 50 && 'text-st-success-500'
            )}>
              <div 
                className="h-full bg-current rounded-sm"
                style={{ width: `${batteryInfo.level}%` }}
              />
              <div className="absolute -right-0.5 top-0.5 w-0.5 h-2 bg-current rounded-r-sm" />
            </div>
            <span>{batteryInfo.level}%</span>
            {batteryInfo.charging && (
              <svg className="w-3 h-3 text-st-warning-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Service Worker Registration Helper
export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setIsRegistered(true);
          setRegistration(reg);
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    isSupported,
    isRegistered,
    registration,
    updateServiceWorker,
  };
};

export default PWAInstallPrompt;