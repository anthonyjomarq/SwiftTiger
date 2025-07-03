import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from '../../shared/components/NotificationHub';
import { useOffline } from './OfflineContext';

const LocationContext = createContext({});

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const { showError, showInfo } = useNotifications();
  const { addPendingAction, isOnline } = useOffline();

  // Load tracking state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tech_location_tracking');
    if (saved === 'true') {
      startTracking();
    }
  }, []);

  // Save tracking state to localStorage
  useEffect(() => {
    localStorage.setItem('tech_location_tracking', isTracking.toString());
  }, [isTracking]);

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
    });
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      showError('Location Error', 'Geolocation is not supported by this device');
      return false;
    }

    try {
      // Get initial position
      const position = await getCurrentPosition();
      setCurrentLocation(position);
      setLocationError(null);
      
      // Start watching position
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          
          setCurrentLocation(location);
          setLocationError(null);
          
          // Add to history
          setLocationHistory(prev => {
            const newHistory = [...prev, location];
            // Keep only last 100 locations
            return newHistory.slice(-100);
          });
          
          // Sync location update
          syncLocationUpdate(location);
        },
        (error) => {
          console.error('Location tracking error:', error);
          setLocationError(error.message);
          
          // Don't stop tracking for temporary errors
          if (error.code !== error.TIMEOUT) {
            showError('Location Error', error.message);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000, // 30 seconds
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      showInfo('Location Tracking', 'GPS tracking started');
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      setLocationError(error.message);
      showError('Location Error', error.message);
      return false;
    }
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsTracking(false);
    setLocationError(null);
    showInfo('Location Tracking', 'GPS tracking stopped');
  };

  const syncLocationUpdate = (location) => {
    const updateData = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: Date.now(),
    };
    
    if (isOnline) {
      // Try to sync immediately
      syncLocationToServer(updateData).catch(error => {
        // If immediate sync fails, add to pending actions
        addPendingAction({
          type: 'UPDATE_LOCATION',
          data: updateData,
        });
      });
    } else {
      // Add to pending actions for later sync
      addPendingAction({
        type: 'UPDATE_LOCATION',
        data: updateData,
      });
    }
  };

  const syncLocationToServer = async (locationData) => {
    const token = localStorage.getItem('tech_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/technician/location', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(locationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const getDistanceTo = (targetLocation) => {
    if (!currentLocation || !targetLocation) {
      return null;
    }

    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = targetLocation.latitude;
    const lon2 = targetLocation.longitude;

    // Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const formatDistance = (meters) => {
    if (meters === null || meters === undefined) {
      return 'Unknown';
    }

    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const isNearLocation = (targetLocation, threshold = 100) => {
    const distance = getDistanceTo(targetLocation);
    return distance !== null && distance <= threshold;
  };

  const getLocationAccuracy = () => {
    if (!currentLocation || !currentLocation.accuracy) {
      return 'Unknown';
    }

    const accuracy = currentLocation.accuracy;
    if (accuracy < 5) {
      return 'Excellent';
    } else if (accuracy < 10) {
      return 'Good';
    } else if (accuracy < 20) {
      return 'Fair';
    } else {
      return 'Poor';
    }
  };

  const getTravelDistance = () => {
    if (locationHistory.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const distance = getDistanceTo(locationHistory[i]);
      if (distance !== null) {
        totalDistance += distance;
      }
    }

    return totalDistance;
  };

  const clearLocationHistory = () => {
    setLocationHistory([]);
  };

  const value = {
    currentLocation,
    isTracking,
    locationError,
    locationHistory,
    startTracking,
    stopTracking,
    getCurrentPosition,
    getDistanceTo,
    formatDistance,
    isNearLocation,
    getLocationAccuracy,
    getTravelDistance,
    clearLocationHistory,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};