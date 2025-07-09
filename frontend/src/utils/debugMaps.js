// Debug utility for Google Maps API
export const debugGoogleMapsAPI = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  console.log('=== Google Maps API Debug ===');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key (first 10 chars):', apiKey?.substring(0, 10));
  console.log('window.google exists:', !!window.google);
  console.log('window.google.maps exists:', !!(window.google && window.google.maps));
  console.log('window.google.maps.places exists:', !!(window.google && window.google.maps && window.google.maps.places));
  
  if (window.google && window.google.maps && window.google.maps.places) {
    console.log('Google Maps Places API is ready!');
  } else {
    console.log('Google Maps Places API is NOT ready');
  }
  
  // Test API key by making a direct request
  if (apiKey) {
    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    console.log('Test URL:', testUrl);
  }
  
  console.log('=== End Debug ===');
};