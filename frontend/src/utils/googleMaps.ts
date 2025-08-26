// Google Maps API utilities

let isGoogleMapsLoaded: boolean = false;
let googleMapsPromise: Promise<void> | null = null;

interface GoogleMapsLoadStatus {
  isLoaded: boolean;
  hasPromise: boolean;
  hasWindowGoogle: boolean;
}

interface GoogleMapsCheckStatus {
  hasGoogle: boolean;
  hasMaps: boolean;
  hasPlaces: boolean;
}

export const loadGoogleMapsScript = (): Promise<void> => {
  const status: GoogleMapsLoadStatus = {
    isLoaded: isGoogleMapsLoaded,
    hasPromise: !!googleMapsPromise,
    hasWindowGoogle: !!window.google
  };
  
  console.log('🔍 Checking Google Maps loading status:', status);
  
  if (isGoogleMapsLoaded) {
    console.log('✅ Google Maps already loaded');
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    console.log('⏳ Google Maps loading in progress...');
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    console.log('🔑 Google Maps API Key status:', apiKey ? 'Found' : 'Missing');
    
    if (!apiKey) {
      reject(new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'));
      return;
    }

    // Check if already loaded with places library
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps already available in window');
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    console.log('🔄 Creating Google Maps script tag...');
    const script: HTMLScriptElement = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    console.log('📍 Google Maps script URL:', script.src);
    
    script.onload = (): void => {
      console.log('📥 Google Maps script loaded, checking APIs...');
      // Wait a bit for places library to be available
      let attempts: number = 0;
      const maxAttempts: number = 50; // 5 seconds max
      
      const checkPlaces = (): void => {
        const status: GoogleMapsCheckStatus = {
          hasGoogle: !!window.google,
          hasMaps: !!(window.google && window.google.maps),
          hasPlaces: !!(window.google && window.google.maps && window.google.maps.places)
        };
        
        console.log(`🔍 Attempt ${attempts + 1}/${maxAttempts}:`, status);
        
        if (status.hasGoogle && status.hasMaps && status.hasPlaces) {
          console.log('✅ Google Maps and Places API fully loaded');
          isGoogleMapsLoaded = true;
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkPlaces, 100);
        } else {
          const error = new Error(`Google Maps Places library failed to load within timeout. Status: google=${status.hasGoogle}, maps=${status.hasMaps}, places=${status.hasPlaces}`);
          console.error('❌', error.message);
          reject(error);
        }
      };
      checkPlaces();
    };
    
    script.onerror = (error: Event | string): void => {
      console.error('❌ Failed to load Google Maps script:', error);
      reject(new Error('Failed to load Google Maps script'));
    };

    console.log('📍 Appending Google Maps script to document head...');
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const isGoogleMapsReady = (): boolean => {
  return isGoogleMapsLoaded && !!window.google && !!window.google.maps && !!window.google.maps.places;
};