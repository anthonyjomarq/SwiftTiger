import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const SimpleMap = () => {
  const mapContainerStyle = {
    width: "100%",
    height: "500px",
  };

  const center = {
    lat: 18.39399662,
    lng: -66.00064454,
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  console.log("SimpleMap - API Key:", apiKey ? "Present" : "Missing");
  console.log("SimpleMap - Center:", center);

  const onMapLoad = (map) => {
    console.log("Map loaded successfully");

    // Create marker using the native Google Maps API
    const marker = new window.google.maps.Marker({
      position: center,
      map: map,
      title: "Crunch Fitness",
      label: {
        text: "CRUNCH FITNESS",
        color: "white",
        fontWeight: "bold",
      },
    });

    marker.addListener("click", () => {
      console.log("Marker clicked!");
      alert("Crunch Fitness marker clicked!");
    });

    console.log("Marker created and added to map");
  };

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        onLoad={onMapLoad}
      />
    </LoadScript>
  );
};

export default SimpleMap;
