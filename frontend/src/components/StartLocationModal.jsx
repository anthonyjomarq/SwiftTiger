import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";

const StartLocationModal = ({ onClose, onLocationSet, currentLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [locationName, setLocationName] = useState(currentLocation.name);
  const [address, setAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center =
    selectedLocation?.lat && selectedLocation?.lng
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : { lat: 18.2208, lng: -66.5901 };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedLocation({ lat, lng, name: locationName });
  };

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    setGeocodeError("");
    try {
      // Use our backend geocoding service
      const response = await axios.post("/api/geocode", {
        address: address,
      });

      if (response.data.latitude && response.data.longitude) {
        setSelectedLocation({
          lat: response.data.latitude,
          lng: response.data.longitude,
          name: locationName || address,
        });
        setLocationName(locationName || address);
        setGeocodeError("");
      } else {
        setGeocodeError("Address not found. Please try a different address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeocodeError(
        "Geocoding failed. Please check your address and try again."
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setGeocodeError("Please enter valid coordinates");
      return;
    }

    setSelectedLocation({
      lat: lat,
      lng: lng,
      name: locationName || "Manual Location",
    });
    setGeocodeError("");
    setShowManualCoords(false);
  };

  const handleSubmit = () => {
    onLocationSet(selectedLocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Set Starting/Ending Location
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Name
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., Office, Warehouse, Home"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or enter an address to geocode
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address (e.g., Dynamics Payments, 3100 Carr 199, Ste 101, San Juan, 00926)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleGeocode}
              disabled={geocoding || !address.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {geocoding ? "Geocoding..." : "Geocode"}
            </button>
          </div>
          {geocodeError && (
            <p className="mt-2 text-sm text-red-600">{geocodeError}</p>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Or enter exact coordinates
            </label>
            <button
              type="button"
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              {showManualCoords ? "Hide" : "Show"} Manual Input
            </button>
          </div>

          {showManualCoords && (
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Latitude (e.g., 18.3648811)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="Longitude (e.g., -66.1771877)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleManualCoords}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Set
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Click on the map to set the starting/ending location for route
            optimization
          </p>
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={selectedLocation ? 14 : 10}
              onClick={handleMapClick}
            >
              {selectedLocation && (
                <Marker
                  position={selectedLocation}
                  label={{
                    text: "START/END",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        {selectedLocation && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Selected Location:</strong> {locationName}
            </p>
            <p className="text-sm text-blue-600">
              Coordinates: {selectedLocation.lat.toFixed(6)},{" "}
              {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Set Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartLocationModal;
