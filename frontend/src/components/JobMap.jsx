import React, { useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 18.2208,
  lng: -66.5901,
};

const JobMap = ({ jobs, selectedJob, onJobSelect, startLocation }) => {
  const [directions, setDirections] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);

  // Debug: Check if API key is loaded
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log("Google Maps API Key loaded:", apiKey ? "YES" : "NO");
  console.log("Jobs passed to JobMap:", jobs);
  console.log(
    "Jobs with coordinates:",
    jobs.filter((job) => job.latitude && job.longitude)
  );

  // Log the actual coordinates
  jobs.forEach((job, index) => {
    if (job.latitude && job.longitude) {
      console.log(
        `Job ${index + 1}: ${job.title} at (${job.latitude}, ${job.longitude})`
      );
    }
  });

  if (!apiKey) {
    console.error(
      "Google Maps API Key is missing! Please check your .env file"
    );
  }

  // Calculate map center based on jobs with coordinates
  const jobsWithCoords = jobs.filter((job) => job.latitude && job.longitude);
  const mapCenter =
    jobsWithCoords.length > 0
      ? {
          lat: parseFloat(jobsWithCoords[0].latitude),
          lng: parseFloat(jobsWithCoords[0].longitude),
        }
      : defaultCenter;

  console.log("Map center calculation:", {
    jobsWithCoords: jobsWithCoords.length,
    mapCenter: mapCenter,
    firstJobCoords:
      jobsWithCoords.length > 0
        ? {
            lat: parseFloat(jobsWithCoords[0].latitude),
            lng: parseFloat(jobsWithCoords[0].longitude),
          }
        : null,
  });

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      console.log("JobMap loaded successfully");

      // Clear existing markers
      markers.forEach((marker) => marker.setMap(null));
      const newMarkers = [];

      // Create markers for each job
      jobsWithCoords.forEach((job, index) => {
        const marker = new window.google.maps.Marker({
          position: {
            lat: parseFloat(job.latitude),
            lng: parseFloat(job.longitude),
          },
          map: map,
          title: job.title,
          label: {
            text: (index + 1).toString(),
            color: "white",
            fontWeight: "bold",
          },
        });

        marker.addListener("click", () => {
          console.log("Job marker clicked:", job.title);
          setSelectedMarker(job);
        });

        newMarkers.push(marker);
        console.log(`Marker created for job ${index + 1}: ${job.title}`);
      });

      // Add start/end location marker if provided
      if (startLocation && startLocation.lat && startLocation.lng) {
        const startMarker = new window.google.maps.Marker({
          position: {
            lat: startLocation.lat,
            lng: startLocation.lng,
          },
          map: map,
          title: `Start/End: ${startLocation.name}`,
          label: {
            text: "S",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
          },
        });

        newMarkers.push(startMarker);
        console.log(`Start/End marker created at: ${startLocation.name}`);
      }

      setMarkers(newMarkers);

      // Fit map to show all markers
      if (jobsWithCoords.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        jobsWithCoords.forEach((job) => {
          bounds.extend({
            lat: parseFloat(job.latitude),
            lng: parseFloat(job.longitude),
          });
        });
        map.fitBounds(bounds);
      }
    },
    [jobs, markers, startLocation]
  );

  const calculateRoute = useCallback(() => {
    if (jobs.length < 2) return;

    const directionsService = new window.google.maps.DirectionsService();

    const waypoints = jobs.slice(1, -1).map((job) => ({
      location: {
        lat: parseFloat(job.latitude),
        lng: parseFloat(job.longitude),
      },
      stopover: true,
    }));

    directionsService.route(
      {
        origin: {
          lat: parseFloat(jobs[0].latitude),
          lng: parseFloat(jobs[0].longitude),
        },
        destination: {
          lat: parseFloat(jobs[jobs.length - 1].latitude),
          lng: parseFloat(jobs[jobs.length - 1].longitude),
        },
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        }
      }
    );
  }, [jobs]);

  const getMarkerColor = (job) => {
    switch (job.status) {
      case "completed":
        return "green";
      case "in_progress":
        return "blue";
      case "pending":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      onError={(error) => {
        console.error("Google Maps LoadScript error:", error);
      }}
    >
      <div className="relative">
        <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded shadow">
          <button
            onClick={calculateRoute}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={jobs.length < 2}
          >
            Show Route
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={mapCenter}
          onLoad={onMapLoad}
          onError={(error) => {
            console.error("GoogleMap error:", error);
          }}
        >
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: parseFloat(selectedMarker.latitude),
                lng: parseFloat(selectedMarker.longitude),
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <h3 className="font-bold">{selectedMarker.title}</h3>
                <p className="text-sm">{selectedMarker.customer_name}</p>
                <p className="text-sm">{selectedMarker.customer_address}</p>
                <p className="text-sm">Status: {selectedMarker.status}</p>
                <button
                  onClick={() => onJobSelect(selectedMarker)}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  View Details
                </button>
              </div>
            </InfoWindow>
          )}

          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default JobMap;
