require("dotenv").config();
const axios = require("axios");
const { pool } = require("../database");
const { log } = require("../utils/logger");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Manual overrides for known problematic addresses in Puerto Rico
const MANUAL_OVERRIDES = {};

// Known problematic addresses with manual coordinates
const KNOWN_ADDRESSES = {
  "3100 Carr 199, Ste 101, San Juan, 00926": {
    latitude: 18.3648811,
    longitude: -66.1771877,
    name: "Dynamics Payments Building",
    verified: true,
  },
  "Dynamics Payments, 3100 Carr 199, Ste 101, San Juan, 00926": {
    latitude: 18.3648811,
    longitude: -66.1771877,
    name: "Dynamics Payments Building",
    verified: true,
  },
  "Dynamics Payments Building": {
    latitude: 18.3648811,
    longitude: -66.1771877,
    name: "Dynamics Payments Building",
    verified: true,
  },
};

// Enhanced geocoding with multiple search strategies
async function geocodeAddress(address) {
  try {
    log.debug("Checking manual override for address", { address });
    const manualOverride = checkManualOverride(address);
    if (manualOverride) {
      log.debug("Using manual override for address", { address });
      return {
        latitude: manualOverride.latitude,
        longitude: manualOverride.longitude,
        formatted_address: manualOverride.formatted_address,
        location_type: "MANUAL_OVERRIDE",
        verified: true,
      };
    }

    log.debug("Geocoding address", { address });

    // Check if this is a known address with manual coordinates
    const knownAddress = KNOWN_ADDRESSES[address.trim()];
    if (knownAddress) {
      log.debug("Using known coordinates for address", { address });
      return {
        latitude: knownAddress.latitude,
        longitude: knownAddress.longitude,
        formatted_address: knownAddress.name,
        location_type: "MANUAL_OVERRIDE",
        confidence_score: 1.0, // Manual overrides have 100% confidence
        verified: knownAddress.verified,
      };
    }

    // Try multiple geocoding strategies
    const strategies = [
      // Strategy 1: Exact address search
      { address: address, region: "PR" },
      // Strategy 2: Add "Puerto Rico" for better context
      { address: `${address}, Puerto Rico`, region: "PR" },
      // Strategy 3: Try with business name if it looks like a business
      ...(address.toLowerCase().includes("dynamics") ||
      address.toLowerCase().includes("payments")
        ? [{ address: `Dynamics Payments ${address}`, region: "PR" }]
        : []),
      // Strategy 4: Try with "San Juan, PR" for better specificity
      {
        address: address.replace(/San Juan,\s*\d{5}/, "San Juan, PR"),
        region: "PR",
      },
    ];

    let bestResult = null;
    let bestScore = 0;

    for (const strategy of strategies) {
      try {
        log.debug("Trying geocoding strategy", { strategy: strategy.address });

        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address: strategy.address,
              key: GOOGLE_MAPS_API_KEY,
              region: strategy.region,
              bounds: "18.0,-67.0|18.5,-65.5", // Puerto Rico bounds
              components: "country:PR",
            },
          }
        );

        if (response.data.results && response.data.results.length > 0) {
          const result = selectBestGeocodeResult(
            response.data.results,
            address
          );
          const score = calculateGeocodeScore(result, address);

          log.debug("Strategy result", {
            formattedAddress: result.formatted_address,
            score,
          });

          if (score > bestScore) {
            bestResult = result;
            bestScore = score;
          }
        }
      } catch (error) {
        log.debug("Strategy failed", { error: error.message });
        continue;
      }
    }

    if (bestResult) {
      const location = bestResult.geometry.location;
      log.debug("Best geocoding result", {
        formattedAddress: bestResult.formatted_address,
        score: bestScore,
      });

      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: bestResult.formatted_address,
        location_type: bestResult.geometry.location_type,
        confidence_score: bestScore,
        verified: bestScore > 0.8,
      };
    } else {
      throw new Error("No results found for this address");
    }
  } catch (error) {
    log.error("Geocoding error", error, { address });
    throw error;
  }
}

// Select the best result from multiple geocoding results
function selectBestGeocodeResult(results, originalAddress) {
  let bestResult = results[0];
  let bestScore = 0;

  for (const result of results) {
    const score = calculateGeocodeScore(result, originalAddress);

    // Prefer establishment or point_of_interest over street_address
    if (
      result.types.includes("establishment") ||
      result.types.includes("point_of_interest")
    ) {
      if (score > bestScore) {
        bestResult = result;
        bestScore = score;
      }
    }
    // If no establishment found, prefer rooftop over approximate
    else if (
      result.geometry.location_type === "ROOFTOP" &&
      bestResult.geometry.location_type !== "ROOFTOP"
    ) {
      if (score > bestScore) {
        bestResult = result;
        bestScore = score;
      }
    }
  }

  return bestResult;
}

// Calculate confidence score for geocoding result
function calculateGeocodeScore(result, originalAddress) {
  let score = 0;
  const originalLower = originalAddress.toLowerCase();
  const resultLower = result.formatted_address.toLowerCase();

  // Base score from location type
  if (result.geometry.location_type === "ROOFTOP") score += 0.3;
  else if (result.geometry.location_type === "RANGE_INTERPOLATED") score += 0.2;
  else if (result.geometry.location_type === "GEOMETRIC_CENTER") score += 0.1;

  // Score based on type matches
  if (result.types.includes("establishment")) score += 0.3;
  if (result.types.includes("point_of_interest")) score += 0.2;
  if (result.types.includes("street_address")) score += 0.1;

  // Score based on address similarity
  const originalWords = originalLower.split(/\s+/);
  const resultWords = resultLower.split(/\s+/);
  const commonWords = originalWords.filter((word) =>
    resultWords.includes(word)
  );
  score += (commonWords.length / originalWords.length) * 0.4;

  // Bonus for exact matches
  if (originalLower.includes("dynamics") && resultLower.includes("dynamics"))
    score += 0.2;
  if (originalLower.includes("payments") && resultLower.includes("payments"))
    score += 0.2;
  if (originalLower.includes("3100") && resultLower.includes("3100"))
    score += 0.1;
  if (originalLower.includes("carr 199") && resultLower.includes("carr 199"))
    score += 0.3;

  return Math.min(score, 1.0);
}

// Validate and suggest corrections for addresses
async function validateAddress(address) {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: address,
          key: GOOGLE_MAPS_API_KEY,
          region: "PR",
        },
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      const suggestions = response.data.results.slice(0, 3).map((result) => ({
        formatted_address: result.formatted_address,
        confidence: calculateGeocodeScore(result, address),
      }));

      return {
        valid: true,
        suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      };
    }

    return { valid: false, suggestions: [] };
  } catch (error) {
    log.error("Address validation error", error, { address });
    return { valid: false, suggestions: [] };
  }
}

// Add a known address to the manual override list
function addKnownAddress(address, latitude, longitude, name = null) {
  KNOWN_ADDRESSES[address.trim()] = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    name: name || address,
    verified: true,
  };
  log.info("Added known address", { address, latitude, longitude });
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

// Helper function to normalize addresses for comparison
function normalizeAddress(address) {
  return address
    .toLowerCase()
    .replace(/[.,]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize spaces
    .replace(/puerto rico|pr/gi, "") // Remove country/state
    .replace(/\b00\d{3}\b/g, "") // Remove zip codes
    .trim();
}

// Check if address matches any manual override
function checkManualOverride(address) {
  const normalized = normalizeAddress(address);
  log.debug("Checking manual override", {
    originalAddress: address,
    normalizedAddress: normalized,
    availableKeys: Object.keys(MANUAL_OVERRIDES),
  });

  // Check for exact match
  if (MANUAL_OVERRIDES[normalized]) {
    log.debug("Found exact manual override match", { address });
    return MANUAL_OVERRIDES[normalized];
  }

  // Check partial matches (70% threshold)
  const addressParts = normalized.split(" ");
  for (const [key, value] of Object.entries(MANUAL_OVERRIDES)) {
    const keyParts = key.split(" ");
    const matchingParts = keyParts.filter((part) =>
      addressParts.some(
        (addressPart) =>
          addressPart.includes(part) || part.includes(addressPart)
      )
    );
    if (matchingParts.length >= keyParts.length * 0.7) {
      log.debug("Found partial manual override match", { address, key });
      return value;
    }
  }
  return null;
}

// Load manual overrides from database on startup
async function loadManualOverrides() {
  try {
    const result = await pool.query(
      "SELECT * FROM geocoding_overrides WHERE active = true"
    );
    result.rows.forEach((row) => {
      const normalizedKey = normalizeAddress(row.search_key);
      MANUAL_OVERRIDES[normalizedKey] = {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        formatted_address: row.formatted_address,
        name: row.name,
        verified: true,
      };
    });
    log.info("Loaded manual geocoding overrides", {
      count: result.rows.length,
    });
  } catch (error) {
    // Table might not exist yet
    log.info("Geocoding overrides table not found, using defaults only");
  }
}

// Call this when the module loads
loadManualOverrides();

module.exports = {
  geocodeAddress,
  updateCustomerCoordinates,
  validateAddress,
  addKnownAddress,
  KNOWN_ADDRESSES,
  loadManualOverrides,
  MANUAL_OVERRIDES,
};
