import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 18.3893, // San Juan center
  lng: -66.0739,
};

// Static libraries array to prevent reloading
const libraries = ["places"];

const RoutePlanning = () => {
  const [startLocation, setStartLocation] = useState("");
  const [startCoords, setStartCoords] = useState({
    lat: 18.3893,
    lng: -66.0739,
  });
  const [startInput, setStartInput] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];
  const [selectedDate, setSelectedDate] = useState(localDate);
  const [loading, setLoading] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [apiKey, setApiKey] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    loadMapsConfig();
    fetchJobs();
  }, [selectedDate]);

  const loadMapsConfig = async () => {
    try {
      const response = await axios.get("/api/maps-config");
      setApiKey(response.data.apiKey);
      setMapsError(null);
    } catch (error) {
      console.error("Error loading maps config:", error);
      setMapsError("Failed to load Google Maps configuration");
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get(
        `/api/jobs/map-data?date=${selectedDate}`
      );
      setAvailableJobs(
        response.data.jobs.filter((job) => job.latitude && job.longitude)
      );
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const addDestination = (job) => {
    if (!destinations.find((dest) => dest.id === job.id)) {
      setDestinations([...destinations, job]);
    }
  };

  const removeDestination = (jobId) => {
    setDestinations(destinations.filter((dest) => dest.id !== jobId));
  };

  const calculateRoute = async () => {
    if (destinations.length === 0) {
      alert("Please add at least one destination");
      return;
    }

    setIsCalculating(true);
    try {
      const response = await axios.post("/api/jobs/optimize-route-advanced", {
        job_ids: destinations.map((job) => job.id),
        start_location: {
          latitude: startCoords.lat,
          longitude: startCoords.lng,
          name: startLocation,
        },
        optimization_type: "distance",
        consider_traffic: true,
        time_windows: false,
      });

      if (response.data) {
        const result = response.data;

        // Reorder destinations based on optimized order
        const optimizedOrder = result.optimized_order;
        const reorderedDestinations = optimizedOrder
          .map((jobId) => destinations.find((dest) => dest.id === jobId))
          .filter(Boolean);

        setOptimizedRoute(reorderedDestinations);
        setTotalDistance(result.total_distance_km);
        setTotalDuration(result.estimated_duration_hours);
        setRouteCalculated(true);

        // Calculate map route after optimization
        setTimeout(() => {
          calculateMapRoute(reorderedDestinations);
        }, 500);

        // Show success message
        alert(
          `Route optimized successfully!\n\nTotal Distance: ${result.total_distance_km} km\nEstimated Duration: ${result.estimated_duration_hours} hours\nStops: ${destinations.length}`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error calculating route. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      setMapLoaded(true);
      console.log("Map loaded, startCoords:", startCoords);
      // Remove programmatic marker creation here
      // If we already have an optimized route, calculate the map route
      if (optimizedRoute.length > 0) {
        setTimeout(() => {
          calculateMapRoute(optimizedRoute);
        }, 1000);
      }
    },
    [optimizedRoute, startCoords]
  );

  const calculateMapRoute = (routeStops) => {
    if (!window.google || !mapRef.current || routeStops.length === 0) {
      console.log("Map route calculation skipped:", {
        google: !!window.google,
        map: !!mapRef.current,
        stops: routeStops.length,
      });
      return;
    }

    try {
      // Create route path manually using polylines
      const routePath = [];

      // Start from the geocoded start location
      routePath.push(startCoords);

      // Add all destination points in optimized order
      routeStops.forEach((job) => {
        routePath.push({
          lat: parseFloat(job.latitude),
          lng: parseFloat(job.longitude),
        });
      });

      // Return to start location
      routePath.push(startCoords);

      // Set the route path for the polyline
      setRoutePath(routePath);
      console.log("Route path created:", routePath);
    } catch (error) {
      console.error("Error calculating map route:", error);
    }
  };

  const clearRoute = () => {
    setDestinations([]);
    setOptimizedRoute([]);
    setRoutePath([]);
    setRouteCalculated(false);
  };

  const printRoute = () => {
    if (!routeCalculated || optimizedRoute.length === 0) return;

    const printWindow = window.open("", "_blank");
    const printContent = `
      <html>
        <head>
          <title>Route Plan - ${selectedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .route-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
            .job-list { margin-top: 20px; }
            .job-item { border-bottom: 1px solid #ddd; padding: 10px 0; }
            .job-number { font-weight: bold; color: #2196F3; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Route Plan</h1>
            <p>Date: ${selectedDate}</p>
            <p>Start Location: ${startLocation}</p>
          </div>
          
          <div class="route-info">
            <h3>Route Summary</h3>
            <p><strong>Total Stops:</strong> ${optimizedRoute.length}</p>
            <p><strong>Start Location:</strong> ${startLocation}</p>
          </div>
          
          <div class="job-list">
            <h3>Optimized Route Sequence</h3>
            ${optimizedRoute
              .map(
                (job, index) => `
              <div class="job-item">
                <span class="job-number">${index + 1}.</span>
                <strong>${job.title}</strong><br>
                <strong>Customer:</strong> ${job.customer_name}<br>
                <strong>Address:</strong> ${job.customer_address}<br>
                <strong>Coordinates:</strong> ${job.latitude}, ${job.longitude}
              </div>
            `
              )
              .join("")}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCoords = { lat, lng };

        setStartCoords(newCoords);
        setStartInput(place.formatted_address || "");
        setStartLocation(place.formatted_address || "");

        // Center the map on the new location
        if (mapRef.current) {
          mapRef.current.panTo(newCoords);
          mapRef.current.setZoom(14); // Zoom in a bit to show the area better
        }

        // Show a brief success message
        console.log("Start location set to:", place.formatted_address);
      }
    }
  };

  const handleMapsLoad = () => {
    setMapsLoaded(true);
    setMapsError(null);
  };

  const handleMapsError = (error) => {
    console.error("Google Maps loading error:", error);
    setMapsError(
      "Failed to load Google Maps. Please check your internet connection."
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Simple Route Optimizer
        </h1>
        <p className="text-gray-600">
          Enter your starting point, add destinations, and calculate the optimal
          route
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Route Setup
            </h3>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Available Jobs */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Jobs ({availableJobs.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableJobs.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No jobs found for selected date
                  </p>
                ) : (
                  availableJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => addDestination(job)}
                    >
                      <p className="font-medium text-sm text-gray-900">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {job.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {job.customer_address}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Destinations */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Destinations ({destinations.length})
              </label>
              <div className="space-y-2">
                {destinations.map((job, index) => (
                  <div
                    key={job.id}
                    className="p-3 border rounded bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {job.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {job.customer_name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDestination(job.id);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={calculateRoute}
                disabled={isCalculating || destinations.length === 0}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? "Calculating..." : "Calculate Optimal Route"}
              </button>

              {routeCalculated && (
                <div className="space-y-2">
                  <button
                    onClick={printRoute}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Print Route
                  </button>
                  <button
                    onClick={clearRoute}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Clear Route
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map and Route Display */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            {/* Map */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Route Map
              </h3>

              {mapsError ? (
                <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded">
                  <div className="text-center">
                    <p className="text-red-600 font-medium mb-2">
                      Google Maps Error
                    </p>
                    <p className="text-red-500 text-sm">{mapsError}</p>
                    <button
                      onClick={loadMapsConfig}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : apiKey ? (
                <LoadScript
                  googleMapsApiKey={apiKey}
                  libraries={libraries}
                  onLoad={handleMapsLoad}
                  onError={handleMapsError}
                >
                  {mapsLoaded ? (
                    <>
                      <div className="mb-4">
                        <label className="block font-medium mb-1">
                          Start Location
                        </label>
                        <Autocomplete
                          onLoad={(ref) => (autocompleteRef.current = ref)}
                          onPlaceChanged={handlePlaceChanged}
                          options={{ componentRestrictions: { country: "PR" } }}
                        >
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded mb-2"
                            value={startInput}
                            onChange={(e) => setStartInput(e.target.value)}
                            placeholder="Enter start address (Google Places supported)"
                          />
                        </Autocomplete>
                        {startLocation && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                            <p className="text-green-800 font-medium">
                              📍 Start Location Set
                            </p>
                            <p className="text-green-700">{startLocation}</p>
                            <p className="text-green-600 text-xs">
                              Coordinates: {startCoords.lat.toFixed(6)},{" "}
                              {startCoords.lng.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={startCoords}
                        zoom={12}
                        onLoad={onMapLoad}
                      >
                        <Marker
                          position={
                            routePath && routePath.length > 0
                              ? routePath[0]
                              : startCoords
                          }
                          icon={
                            window.google
                              ? {
                                  url:
                                    "data:image/svg+xml;charset=UTF-8," +
                                    encodeURIComponent(`
                              <svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\">
                                <circle cx=\"20\" cy=\"20\" r=\"18\" fill=\"#10B981\" stroke=\"white\" stroke-width=\"3\"/>
                                <text x=\"20\" y=\"26\" text-anchor=\"middle\" fill=\"white\" font-size=\"14\" font-weight=\"bold\">START</text>
                              </svg>
                            `),
                                  scaledSize: new window.google.maps.Size(
                                    40,
                                    40
                                  ),
                                  anchor: new window.google.maps.Point(20, 20),
                                }
                              : undefined
                          }
                          title={`Start Location: ${
                            startLocation || "San Juan, PR"
                          }`}
                          zIndex={1000}
                        />
                        {optimizedRoute.map((job, index) => (
                          <Marker
                            key={job.id}
                            position={{
                              lat: parseFloat(job.latitude),
                              lng: parseFloat(job.longitude),
                            }}
                            icon={{
                              url:
                                "data:image/svg+xml;charset=UTF-8," +
                                encodeURIComponent(`
                                <svg width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" xmlns=\"http://www.w3.org/2000/svg\">
                                  <circle cx=\"16\" cy=\"16\" r=\"14\" fill=\"#2196F3\" stroke=\"white\" stroke-width=\"2\"/>
                                  <text x=\"16\" y=\"20\" text-anchor=\"middle\" fill=\"white\" font-size=\"10\" font-weight=\"bold\">${
                                    index + 1
                                  }</text>
                                </svg>
                              `),
                            }}
                            title={`${index + 1}. ${job.title} - ${
                              job.customer_name
                            }`}
                            zIndex={500}
                          />
                        ))}
                        {routePath && routePath.length > 1 && (
                          <Polyline
                            path={routePath}
                            options={{
                              strokeColor: "#2196F3",
                              strokeWeight: 4,
                              strokeOpacity: 0.8,
                              geodesic: true,
                              zIndex: 100,
                            }}
                          />
                        )}
                      </GoogleMap>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="ml-2 text-gray-500">
                        Loading Google Maps API...
                      </p>
                    </div>
                  )}
                </LoadScript>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                  <p className="text-gray-500">Loading map configuration...</p>
                </div>
              )}
            </div>

            {/* Route Display */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Optimized Route
              </h3>

              {!routeCalculated ? (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    Add destinations and calculate route to see the optimized
                    sequence
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      Route Optimized!
                    </h4>
                    <div className="text-sm text-green-800">
                      <p>
                        <strong>Start Location:</strong> {startLocation}
                      </p>
                      <p>
                        <strong>Total Stops:</strong> {optimizedRoute.length}
                      </p>
                      <p>
                        <strong>Optimized Order:</strong> Calculated for minimum
                        distance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      Route Sequence:
                    </h4>
                    {optimizedRoute.map((job, index) => (
                      <div
                        key={job.id}
                        className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-center">
                          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {job.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {job.customer_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {job.customer_address}
                            </p>
                            <p className="text-xs text-blue-600">
                              📍 {job.latitude}, {job.longitude}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> This route is optimized using
                      distance-based algorithms. The sequence minimizes total
                      travel distance between stops.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanning;
