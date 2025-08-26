// Debug utility for Google Maps API

interface GoogleMapsDebugInfo {
  apiKeyExists: boolean;
  apiKeyPreview: string | undefined;
  windowGoogleExists: boolean;
  windowMapsExists: boolean;
  windowPlacesExists: boolean;
  isReady: boolean;
}

export const debugGoogleMapsAPI = (): void => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  
  const debugInfo: GoogleMapsDebugInfo = {
    apiKeyExists: !!apiKey,
    apiKeyPreview: apiKey?.substring(0, 10),
    windowGoogleExists: !!window.google,
    windowMapsExists: !!(window.google && window.google.maps),
    windowPlacesExists: !!(window.google && window.google.maps && window.google.maps.places),
    isReady: !!(window.google && window.google.maps && window.google.maps.places)
  };
  
  console.log('=== Google Maps API Debug ===');
  console.log('API Key exists:', debugInfo.apiKeyExists);
  console.log('API Key (first 10 chars):', debugInfo.apiKeyPreview);
  console.log('window.google exists:', debugInfo.windowGoogleExists);
  console.log('window.google.maps exists:', debugInfo.windowMapsExists);
  console.log('window.google.maps.places exists:', debugInfo.windowPlacesExists);
  
  if (debugInfo.isReady) {
    console.log('Google Maps Places API is ready!');
  } else {
    console.log('Google Maps Places API is NOT ready');
  }
  
  // Test API key by constructing test URL
  if (apiKey) {
    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    console.log('Test URL:', testUrl);
  }
  
  console.log('=== End Debug ===');
};