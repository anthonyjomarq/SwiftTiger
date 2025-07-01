// Main API service (maintains backward compatibility)
export { default as apiService, handleApiError, useApi } from "./api.js";

// Individual services
export { default as authService } from "./authService.js";
export { default as jobService } from "./jobService.js";
export { default as customerService } from "./customerService.js";
export { default as routeService } from "./routeService.js";
export { default as notificationService } from "./notificationService.js";
export { default as activityService } from "./activityService.js";

// Base API class (for advanced usage)
export { default as BaseApi } from "./baseApi.js";

// Default export for backward compatibility
export { default } from "./api.js";
