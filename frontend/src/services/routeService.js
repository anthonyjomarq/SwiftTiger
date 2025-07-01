import BaseApi from "./baseApi.js";

/**
 * @typedef {Object} RouteOptimizationRequest
 * @property {Array<Object>} jobs - Array of job objects to optimize
 * @property {Object} startLocation - Starting location coordinates {lat, lng}
 * @property {Object} [options] - Optimization options
 * @property {string} [options.algorithm] - Optimization algorithm (nearest_neighbor, genetic, etc.)
 * @property {boolean} [options.avoidTolls] - Whether to avoid toll roads
 * @property {boolean} [options.avoidHighways] - Whether to avoid highways
 * @property {string} [options.travelMode] - Travel mode (driving, walking, bicycling, transit)
 * @property {number} [options.maxDistance] - Maximum total distance in meters
 * @property {number} [options.maxDuration] - Maximum total duration in seconds
 */

/**
 * @typedef {Object} RouteOptimizationResponse
 * @property {Array<Object>} optimizedRoute - Optimized route with job order
 * @property {number} totalDistance - Total distance in meters
 * @property {number} totalDuration - Total duration in seconds
 * @property {Array<Object>} waypoints - Array of waypoints with coordinates
 * @property {Object} [metadata] - Additional route metadata
 */

/**
 * @typedef {Object} EtaCalculationRequest
 * @property {Array<Object>} route - Route with job locations
 * @property {Object} startLocation - Starting location coordinates {lat, lng}
 * @property {Date} [startTime] - Start time for ETA calculation
 * @property {Object} [options] - ETA calculation options
 * @property {string} [options.travelMode] - Travel mode (driving, walking, bicycling, transit)
 * @property {boolean} [options.includeTraffic] - Whether to include traffic data
 * @property {number} [options.jobDuration] - Average duration per job in minutes
 */

/**
 * @typedef {Object} EtaCalculationResponse
 * @property {Array<Object>} etas - Array of ETAs for each job
 * @property {Date} estimatedStartTime - Estimated start time
 * @property {Date} estimatedEndTime - Estimated end time
 * @property {number} totalDuration - Total duration including travel and job time
 * @property {Array<Object>} [trafficInfo] - Traffic information if available
 */

/**
 * Route service for handling route planning and optimization
 * @class RouteService
 * @extends BaseApi
 */
class RouteService extends BaseApi {
  /**
   * Create a new RouteService instance
   * @param {Object} config - Configuration for the API instance
   */
  constructor(config = {}) {
    super(config);
  }

  /**
   * Optimize route for multiple jobs
   * @param {RouteOptimizationRequest} optimizationData - Route optimization data
   * @returns {Promise<RouteOptimizationResponse>} Optimized route
   * @throws {Error} When route optimization fails
   */
  async optimize(optimizationData) {
    try {
      const response = await this.request({
        method: "POST",
        url: "/routes/optimize",
        data: optimizationData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Calculate ETAs for a route
   * @param {EtaCalculationRequest} etaData - ETA calculation data
   * @returns {Promise<EtaCalculationResponse>} ETA calculations
   * @throws {Error} When ETA calculation fails
   */
  async calculateETA(etaData) {
    try {
      const response = await this.request({
        method: "POST",
        url: "/routes/eta",
        data: etaData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get route between two points
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @param {Object} options - Route options
   * @returns {Promise<Object>} Route information
   * @throws {Error} When route retrieval fails
   */
  async getRoute(origin, destination, options = {}) {
    try {
      const response = await this.request({
        method: "POST",
        url: "/routes/directions",
        data: {
          origin,
          destination,
          options,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get real-time traffic information
   * @param {Array<Object>} waypoints - Array of waypoints to check traffic for
   * @returns {Promise<Object>} Traffic information
   * @throws {Error} When traffic data retrieval fails
   */
  async getTrafficInfo(waypoints) {
    try {
      const response = await this.request({
        method: "POST",
        url: "/routes/traffic",
        data: { waypoints },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Save a route for later use
   * @param {Object} routeData - Route data to save
   * @returns {Promise<Object>} Saved route information
   * @throws {Error} When route saving fails
   */
  async saveRoute(routeData) {
    try {
      const response = await this.request({
        method: "POST",
        url: "/routes/save",
        data: routeData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get saved routes for a user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of saved routes
   * @throws {Error} When route retrieval fails
   */
  async getSavedRoutes(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/routes/saved",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific saved route
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Saved route details
   * @throws {Error} When route retrieval fails
   */
  async getSavedRoute(routeId) {
    try {
      const response = await this.request({
        method: "GET",
        url: `/routes/saved/${routeId}`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a saved route
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Deletion confirmation
   * @throws {Error} When route deletion fails
   */
  async deleteSavedRoute(routeId) {
    try {
      const response = await this.request({
        method: "DELETE",
        url: `/routes/saved/${routeId}`,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get route statistics
   * @param {Object} params - Query parameters for statistics
   * @returns {Promise<Object>} Route statistics
   * @throws {Error} When statistics retrieval fails
   */
  async getStatistics(params = {}) {
    try {
      const response = await this.request({
        method: "GET",
        url: "/routes/statistics",
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const routeService = new RouteService();

export default routeService;
