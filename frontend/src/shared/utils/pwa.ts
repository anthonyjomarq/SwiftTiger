// PWA utilities for service worker registration and management
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
  }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              showUpdateNotification();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  
  console.log('Service Workers not supported');
  return null;
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unregisterPromises = registrations.map(registration => registration.unregister());
      await Promise.all(unregisterPromises);
      console.log('Service Workers unregistered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }
  return false;
};

export const setupInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    
    // Show install button or prompt
    showInstallPrompt();
  });
  
  // Track successful installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed successfully');
    deferredPrompt = null;
    hideInstallPrompt();
    
    // Track installation analytics
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'Install'
      });
    }
  });
};

export const showInstallPrompt = (): void => {
  // Create and show install prompt UI
  const installPrompt = document.createElement('div');
  installPrompt.id = 'pwa-install-prompt';
  installPrompt.className = 'fixed bottom-4 left-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm';
  installPrompt.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex-1 mr-3">
        <h4 class="font-medium">Install SwiftTiger</h4>
        <p class="text-sm opacity-90">Add to your home screen for quick access</p>
      </div>
      <div class="flex space-x-2">
        <button id="pwa-install-btn" class="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium">
          Install
        </button>
        <button id="pwa-dismiss-btn" class="text-white opacity-75 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(installPrompt);
  
  // Handle install button click
  document.getElementById('pwa-install-btn')?.addEventListener('click', installApp);
  
  // Handle dismiss button click
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    hideInstallPrompt();
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  });
};

export const hideInstallPrompt = (): void => {
  const prompt = document.getElementById('pwa-install-prompt');
  if (prompt) {
    prompt.remove();
  }
};

export const installApp = async (): Promise<void> => {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return;
  }
  
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    
    if (choice.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    deferredPrompt = null;
    hideInstallPrompt();
  } catch (error) {
    console.error('Install prompt failed:', error);
  }
};

export const checkInstallEligibility = (): boolean => {
  // Check if app can be installed
  if (deferredPrompt) {
    return true;
  }
  
  // Check if already installed
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  // Check if install was previously dismissed recently
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) { // Don't show again for 7 days
      return false;
    }
  }
  
  return false;
};

export const showUpdateNotification = (): void => {
  // Create update notification
  const updateNotification = document.createElement('div');
  updateNotification.id = 'pwa-update-notification';
  updateNotification.className = 'fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm';
  updateNotification.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex-1 mr-3">
        <h4 class="font-medium">Update Available</h4>
        <p class="text-sm opacity-90">A new version of SwiftTiger is ready</p>
      </div>
      <div class="flex space-x-2">
        <button id="pwa-update-btn" class="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium">
          Update
        </button>
        <button id="pwa-update-dismiss-btn" class="text-white opacity-75 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(updateNotification);
  
  // Handle update button click
  document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
  
  // Handle dismiss button click
  document.getElementById('pwa-update-dismiss-btn')?.addEventListener('click', () => {
    const notification = document.getElementById('pwa-update-notification');
    if (notification) {
      notification.remove();
    }
  });
};

export const isStandalone = (): boolean => {
  return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
};

export const requestPersistentStorage = async (): Promise<boolean> => {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      const persistent = await navigator.storage.persist();
      console.log('Persistent storage granted:', persistent);
      return persistent;
    } catch (error) {
      console.error('Persistent storage request failed:', error);
      return false;
    }
  }
  return false;
};

// Utility to check if device supports notifications
export const canShowNotifications = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!canShowNotifications()) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Notification permission request failed:', error);
    return 'denied';
  }
};

// Show local notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });
  }
};