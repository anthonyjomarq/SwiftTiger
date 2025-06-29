require("dotenv").config();
const axios = require("axios");
const { pool } = require("../database");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function geocodeAddress(address) {
  try {
    console.log(`Geocoding address: ${address}`);

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: address,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      // Try to find the most specific result (establishment/point_of_interest preferred)
      let bestResult = response.data.results[0];

      for (const result of response.data.results) {
        // Prefer establishment or point_of_interest over street_address
        if (
          result.types.includes("establishment") ||
          result.types.includes("point_of_interest")
        ) {
          bestResult = result;
          break;
        }
        // If no establishment found, prefer rooftop over approximate
        else if (
          result.geometry.location_type === "ROOFTOP" &&
          bestResult.geometry.location_type !== "ROOFTOP"
        ) {
          bestResult = result;
        }
      }

      const location = bestResult.geometry.location;

      console.log(`Selected result: ${bestResult.formatted_address}`);
      console.log(`Location type: ${bestResult.geometry.location_type}`);
      console.log(`Types: ${bestResult.types.join(", ")}`);

      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: bestResult.formatted_address,
        location_type: bestResult.geometry.location_type,
      };
    } else {
      throw new Error("No results found for this address");
    }
  } catch (error) {
    console.error("Geocoding error:", error.response?.data || error.message);
    throw error;
  }
}

const updateCustomerCoordinates = async (customerId, address) => {
  const location = await geocodeAddress(address);
  if (location) {
    await pool.query(
      "UPDATE customers SET latitude = $1, longitude = $2, geocoded_at = CURRENT_TIMESTAMP WHERE id = $3",
      [location.latitude, location.longitude, customerId]
    );
    return location;
  }
  return null;
};

module.exports = { geocodeAddress, updateCustomerCoordinates };
