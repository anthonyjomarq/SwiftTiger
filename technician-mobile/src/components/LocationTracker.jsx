import React, { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { MobileActionSheet } from '../../shared/components/MobileLayout';

const LocationTracker = () => {
  const { 
    currentLocation, 
    isTracking, 
    locationError, 
    startTracking, 
    stopTracking, 
    getLocationAccuracy,
    getTravelDistance,
    formatDistance 
  } = useLocation();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [travelDistance, setTravelDistance] = useState(0);

  // Update travel distance periodically
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setTravelDistance(getTravelDistance());
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isTracking, getTravelDistance]);

  if (!user || user.role !== 'technician') {
    return null;
  }

  const formatCoordinate = (value, type) => {
    if (!value) return 'Unknown';
    return `${Math.abs(value).toFixed(6)}°${type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W')}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Don't show anything if location tracking is off and no error
  if (!isTracking && !locationError) {
    return null;
  }

  return (
    <>
      {/* Location status indicator - only show when tracking or there's an error */}
      {(isTracking || locationError) && (
        <div 
          className={`fixed bottom-20 right-4 z-40 px-3 py-2 rounded-full shadow-lg cursor-pointer transition-all duration-300 ${
            locationError 
              ? 'bg-red-500 text-white'
              : currentLocation 
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-yellow-900'
          }`}
          onClick={() => setShowDetails(true)}
        >
          <div className="flex items-center space-x-2">
            {locationError ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : currentLocation ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">
              {locationError 
                ? 'GPS Error'
                : currentLocation 
                  ? 'GPS Active'
                  : 'Getting GPS...'
              }
            </span>
          </div>
        </div>
      )}

      <MobileActionSheet
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title="Location Tracking"
      >
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">GPS Tracking</div>
              <div className="text-sm text-gray-600">
                {isTracking ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              isTracking 
                ? locationError 
                  ? 'bg-red-500' 
                  : 'bg-green-500'
                : 'bg-gray-400'
            }`} />
          </div>

          {/* Location Details */}
          {currentLocation && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Current Location</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Latitude</div>
                  <div className="font-mono">{formatCoordinate(currentLocation.latitude, 'lat')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Longitude</div>
                  <div className="font-mono">{formatCoordinate(currentLocation.longitude, 'lng')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Accuracy</div>
                  <div>{currentLocation.accuracy ? `±${Math.round(currentLocation.accuracy)}m` : 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Quality</div>
                  <div>{getLocationAccuracy()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Last Update</div>
                  <div>{formatTimestamp(currentLocation.timestamp)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Travel Distance</div>
                  <div>{formatDistance(travelDistance)}</div>
                </div>
              </div>

              {currentLocation.speed !== null && currentLocation.speed > 0 && (
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-sm text-blue-800">
                    Speed: {Math.round(currentLocation.speed * 3.6)} km/h
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-medium text-red-800 mb-1">Location Error</div>
              <div className="text-sm text-red-700">{locationError}</div>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-2">
            {isTracking ? (
              <button
                onClick={() => {
                  stopTracking();
                  setShowDetails(false);
                }}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Stop Tracking
              </button>
            ) : (
              <button
                onClick={() => {
                  startTracking();
                  setShowDetails(false);
                }}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Start Tracking
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            Location tracking helps with job navigation, time tracking, and service verification. 
            Your location data is only used for work-related purposes.
          </div>
        </div>
      </MobileActionSheet>
    </>
  );
};

export default LocationTracker;