import React, { useState, useEffect } from "react";
import realtimeService from "../services/realtimeService";
import { useAuth } from "../contexts/AuthContext";

const ETACalculator = ({ fromLocation, toLocation, onETAUpdate }) => {
  const { token } = useAuth();
  const [eta, setEta] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [considerTraffic, setConsiderTraffic] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fromLocation && toLocation) {
      calculateETA();
    }
  }, [fromLocation, toLocation, considerTraffic]);

  const calculateETA = async () => {
    if (!fromLocation || !toLocation) {
      setError("Both start and destination locations are required");
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const etaData = await realtimeService.calculateETA(
        fromLocation,
        toLocation,
        considerTraffic,
        token
      );

      setEta(etaData);
      if (onETAUpdate) {
        onETAUpdate(etaData);
      }
    } catch (error) {
      console.error("ETA calculation failed:", error);
      setError("Failed to calculate ETA. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters) => {
    const kilometers = meters / 1000;
    if (kilometers >= 1) {
      return `${kilometers.toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTrafficLevel = (etaData) => {
    if (
      !etaData.durationInTraffic ||
      etaData.duration === etaData.durationInTraffic
    ) {
      return { level: "No Traffic Data", color: "text-gray-500" };
    }

    const difference = etaData.durationInTraffic - etaData.duration;
    const percentage = (difference / etaData.duration) * 100;

    if (percentage < 10) {
      return { level: "Light Traffic", color: "text-green-600" };
    } else if (percentage < 30) {
      return { level: "Moderate Traffic", color: "text-yellow-600" };
    } else {
      return { level: "Heavy Traffic", color: "text-red-600" };
    }
  };

  if (!fromLocation || !toLocation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          ETA Calculator
        </h3>
        <p className="text-gray-500">
          Select start and destination locations to calculate ETA.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">ETA Calculator</h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={considerTraffic}
              onChange={(e) => setConsiderTraffic(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600">Consider Traffic</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {isCalculating && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Calculating ETA...</span>
        </div>
      )}

      {eta && !isCalculating && (
        <div className="space-y-4">
          {/* Main ETA Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatDuration(eta.durationInTraffic || eta.duration)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Arrival: {formatTime(eta.eta)}
              </div>
            </div>
          </div>

          {/* Traffic Information */}
          {eta.trafficLevel && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Traffic Level:
              </span>
              <span
                className={`text-sm font-medium ${getTrafficLevel(eta).color}`}
              >
                {getTrafficLevel(eta).level}
              </span>
            </div>
          )}

          {/* Route Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-lg font-semibold text-gray-800">
                {formatDistance(eta.distance)}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Base Duration</div>
              <div className="text-lg font-semibold text-gray-800">
                {formatDuration(eta.duration)}
              </div>
            </div>
          </div>

          {/* Traffic Impact */}
          {eta.durationInTraffic && eta.durationInTraffic !== eta.duration && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">
                  Traffic Impact:
                </span>
                <span className="text-sm font-medium text-yellow-800">
                  +{formatDuration(eta.durationInTraffic - eta.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Route Steps */}
          {eta.steps && eta.steps.length > 0 && (
            <div className="border rounded-lg">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-sm font-medium text-gray-700">
                  Route Steps
                </h4>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {eta.steps.slice(0, 5).map((step, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 border-b last:border-b-0"
                  >
                    <div
                      className="text-sm text-gray-800"
                      dangerouslySetInnerHTML={{ __html: step.instruction }}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistance(step.distance)} •{" "}
                      {formatDuration(step.duration)}
                    </div>
                  </div>
                ))}
                {eta.steps.length > 5 && (
                  <div className="px-4 py-2 text-xs text-gray-500">
                    +{eta.steps.length - 5} more steps
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700 mb-1">From:</div>
            <div className="text-gray-600">
              {fromLocation?.address ||
                (fromLocation?.latitude && fromLocation?.longitude
                  ? `${fromLocation.latitude.toFixed(
                      6
                    )}, ${fromLocation.longitude.toFixed(6)}`
                  : "Location not set")}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-1">To:</div>
            <div className="text-gray-600">
              {toLocation?.address ||
                (toLocation?.latitude && toLocation?.longitude
                  ? `${toLocation.latitude.toFixed(
                      6
                    )}, ${toLocation.longitude.toFixed(6)}`
                  : "Location not set")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ETACalculator;
