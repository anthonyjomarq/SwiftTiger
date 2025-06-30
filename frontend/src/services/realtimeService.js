import { io } from "socket.io-client";
import axios from "axios";

class RealtimeService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.locationWatchId = null;
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  }

  // Initialize WebSocket connection
  connect(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.baseURL, {
      auth: {
        token,
      },
    });

    this.socket.on("connect", () => {
      console.log("Connected to real-time service");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from real-time service");
      this.isConnected = false;
    });

    return this.socket;
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopLocationTracking();
  }

  // Join technician room for location updates
  joinTechnicianRoom(technicianId) {
    if (this.socket) {
      this.socket.emit("join_technician_room", technicianId);
    }
  }

  // Join route room for real-time updates
  joinRouteRoom(routeId) {
    if (this.socket) {
      this.socket.emit("join_route_room", routeId);
    }
  }

  // Start location tracking for technicians
  startLocationTracking(userId, token) {
    if (this.locationWatchId) {
      this.stopLocationTracking();
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      return;
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        // Send location update to server
        this.updateLocation(userId, locationData, token);
      },
      (error) => {
        console.error("Location tracking error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 15000, // 15 seconds
      }
    );
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  // Update location on server
  async updateLocation(userId, locationData, token) {
    try {
      await axios.post(
        `${this.baseURL}/api/technicians/${userId}/location`,
        locationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  }

  // Get technician locations
  async getTechnicianLocations(token) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/technicians/locations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.locations;
    } catch (error) {
      console.error("Failed to get technician locations:", error);
      return [];
    }
  }

  // Calculate ETA with traffic
  async calculateETA(fromLocation, toLocation, considerTraffic = true, token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/eta/calculate`,
        {
          fromLocation,
          toLocation,
          considerTraffic,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to calculate ETA:", error);
      throw error;
    }
  }

  // Share route
  async shareRoute(routeId, routeData, token) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/routes/share`,
        {
          routeId,
          routeData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to share route:", error);
      throw error;
    }
  }

  // Get shared route
  async getSharedRoute(token) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/routes/shared/${token}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get shared route:", error);
      throw error;
    }
  }

  // Listen for location updates
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on("location_update", callback);
    }
  }

  // Listen for route updates
  onRouteUpdate(callback) {
    if (this.socket) {
      this.socket.on("route_updated", callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
