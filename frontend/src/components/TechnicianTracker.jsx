import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import realtimeService from "../services/realtimeService";
import { useAuth } from "../contexts/AuthContext";

const TechnicianTracker = () => {
  const { user, token } = useAuth();
  const [technicianLocations, setTechnicianLocations] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 18.3893, lng: -66.0739 }); // Default to San Juan, Puerto Rico
  const mapRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      // Initialize real-time service
      realtimeService.connect(token);

      // Start location tracking if user is a technician
      if (user.role === "technician") {
        startTracking();
      }

      // Load initial technician locations
      loadTechnicianLocations();

      // Set up real-time location updates
      realtimeService.onLocationUpdate((data) => {
        setTechnicianLocations((prev) => {
          const updated = prev.filter(
            (loc) => loc.user_id !== data.technicianId
          );
          return [
            ...updated,
            {
              user_id: data.technicianId,
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              accuracy: data.location.accuracy,
              updated_at: new Date(data.location.timestamp),
            },
          ];
        });
      });

      // Set up periodic location refresh
      const interval = setInterval(loadTechnicianLocations, 30000); // Every 30 seconds

      return () => {
        clearInterval(interval);
        realtimeService.disconnect();
      };
    }
  }, [user, token]);

  const startTracking = () => {
    if (navigator.geolocation) {
      setIsTracking(true);
      realtimeService.startLocationTracking(user.id, token);

      // Get current position for map center and zoom
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setMapCenter(location);

          // Zoom in closer when tracking starts
          if (mapRef.current) {
            mapRef.current.setZoom(15); // Zoom level 15 for street-level view
            mapRef.current.panTo(location);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    realtimeService.stopLocationTracking();
  };

  const loadTechnicianLocations = async () => {
    try {
      const locations = await realtimeService.getTechnicianLocations(token);
      setTechnicianLocations(locations);

      // Update map center if no current location and we have technician locations
      if (!currentLocation && locations.length > 0) {
        const firstLocation = locations[0];
        const newCenter = {
          lat: parseFloat(firstLocation.latitude),
          lng: parseFloat(firstLocation.longitude),
        };
        setMapCenter(newCenter);

        // Zoom to technician location if map is loaded
        if (mapRef.current) {
          mapRef.current.setZoom(15);
          mapRef.current.panTo(newCenter);
        }
      }
    } catch (error) {
      console.error("Failed to load technician locations:", error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMarkerIcon = (role) => {
    return role === "technician" ? "🔧" : "👤";
  };

  const mapContainerStyle = {
    width: "100%",
    height: "500px",
  };

  const mapOptions = {
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    gestureHandling: "greedy",
    zoom: 15, // Default zoom level for street view
  };

  const onMapLoad = (map) => {
    mapRef.current = map;

    // If we have a current location and tracking is active, zoom to it
    if (currentLocation && isTracking) {
      map.setZoom(15);
      map.panTo(currentLocation);
    }
  };

  const centerOnCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setMapCenter(location);

          if (mapRef.current) {
            mapRef.current.setZoom(15);
            mapRef.current.panTo(location);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
        }
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Technician Tracker</h2>
        <div className="flex items-center space-x-4">
          {user?.role === "technician" && (
            <>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isTracking
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isTracking ? "🟢 Tracking Active" : "🔴 Tracking Inactive"}
              </span>
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isTracking
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isTracking ? "Stop Tracking" : "Start Tracking"}
              </button>
            </>
          )}
          <button
            onClick={centerOnCurrentLocation}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            title="Center on my location"
          >
            📍 Center
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicianLocations.map((location) => (
            <div
              key={location.user_id}
              className="bg-gray-50 p-4 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedTechnician(location)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getMarkerIcon(location.role)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {location.technician_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Last seen: {formatTime(location.updated_at)}
                  </p>
                  {location.accuracy && (
                    <p className="text-xs text-gray-500">
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={15}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Current user location marker */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: { width: 24, height: 24 },
              }}
              title="Your Location"
            />
          )}

          {/* Technician location markers */}
          {technicianLocations.map((location) => (
            <Marker
              key={location.user_id}
              position={{
                lat: parseFloat(location.latitude),
                lng: parseFloat(location.longitude),
              }}
              icon={{
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#FF6B35" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🔧</text>
                  </svg>
                `),
                scaledSize: { width: 24, height: 24 },
              }}
              onClick={() => setSelectedTechnician(location)}
              title={location.technician_name}
            />
          ))}

          {/* Info window for selected technician */}
          {selectedTechnician && (
            <InfoWindow
              position={{
                lat: parseFloat(selectedTechnician.latitude),
                lng: parseFloat(selectedTechnician.longitude),
              }}
              onCloseClick={() => setSelectedTechnician(null)}
            >
              <div className="p-2">
                <h3 className="font-semibold text-gray-800">
                  {selectedTechnician.technician_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Last updated: {formatTime(selectedTechnician.updated_at)}
                </p>
                {selectedTechnician.accuracy && (
                  <p className="text-xs text-gray-500">
                    Accuracy: ±{Math.round(selectedTechnician.accuracy)}m
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Coordinates:{" "}
                  {parseFloat(selectedTechnician.latitude).toFixed(6)},{" "}
                  {parseFloat(selectedTechnician.longitude).toFixed(6)}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {technicianLocations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No technicians are currently being tracked.</p>
          {user?.role === "technician" && (
            <p className="mt-2">
              Click "Start Tracking" to begin sharing your location.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TechnicianTracker;
