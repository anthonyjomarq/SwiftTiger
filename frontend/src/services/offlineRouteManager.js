class OfflineRouteManager {
  constructor() {
    this.storageKey = "offline_routes";
    this.maxRoutes = 50; // Maximum number of routes to store offline
  }

  // Save a route for offline access
  saveRoute(routeData) {
    try {
      const routes = this.getOfflineRoutes();
      const routeId = routeData.routeId || `route_${Date.now()}`;

      const routeToSave = {
        ...routeData,
        routeId,
        savedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      };

      // Remove existing route with same ID if it exists
      const filteredRoutes = routes.filter(
        (route) => route.routeId !== routeId
      );

      // Add new route at the beginning
      const updatedRoutes = [routeToSave, ...filteredRoutes];

      // Limit the number of stored routes
      if (updatedRoutes.length > this.maxRoutes) {
        updatedRoutes.splice(this.maxRoutes);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(updatedRoutes));

      return {
        success: true,
        routeId,
        message: "Route saved for offline access",
      };
    } catch (error) {
      console.error("Failed to save route offline:", error);
      return {
        success: false,
        error: "Failed to save route for offline access",
      };
    }
  }

  // Get all offline routes
  getOfflineRoutes() {
    try {
      const routes = localStorage.getItem(this.storageKey);
      return routes ? JSON.parse(routes) : [];
    } catch (error) {
      console.error("Failed to get offline routes:", error);
      return [];
    }
  }

  // Get a specific offline route by ID
  getOfflineRoute(routeId) {
    try {
      const routes = this.getOfflineRoutes();
      const route = routes.find((r) => r.routeId === routeId);

      if (route) {
        // Update last accessed time
        route.lastAccessed = new Date().toISOString();
        this.updateRouteAccess(routeId);
        return route;
      }

      return null;
    } catch (error) {
      console.error("Failed to get offline route:", error);
      return null;
    }
  }

  // Update route access time
  updateRouteAccess(routeId) {
    try {
      const routes = this.getOfflineRoutes();
      const updatedRoutes = routes.map((route) => {
        if (route.routeId === routeId) {
          return { ...route, lastAccessed: new Date().toISOString() };
        }
        return route;
      });

      localStorage.setItem(this.storageKey, JSON.stringify(updatedRoutes));
    } catch (error) {
      console.error("Failed to update route access time:", error);
    }
  }

  // Delete an offline route
  deleteOfflineRoute(routeId) {
    try {
      const routes = this.getOfflineRoutes();
      const updatedRoutes = routes.filter((route) => route.routeId !== routeId);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedRoutes));

      return {
        success: true,
        message: "Route deleted from offline storage",
      };
    } catch (error) {
      console.error("Failed to delete offline route:", error);
      return {
        success: false,
        error: "Failed to delete route from offline storage",
      };
    }
  }

  // Clear all offline routes
  clearAllOfflineRoutes() {
    try {
      localStorage.removeItem(this.storageKey);
      return {
        success: true,
        message: "All offline routes cleared",
      };
    } catch (error) {
      console.error("Failed to clear offline routes:", error);
      return {
        success: false,
        error: "Failed to clear offline routes",
      };
    }
  }

  // Get offline routes sorted by last accessed
  getOfflineRoutesSorted() {
    const routes = this.getOfflineRoutes();
    return routes.sort((a, b) => {
      return new Date(b.lastAccessed) - new Date(a.lastAccessed);
    });
  }

  // Get offline routes sorted by save date
  getOfflineRoutesByDate() {
    const routes = this.getOfflineRoutes();
    return routes.sort((a, b) => {
      return new Date(b.savedAt) - new Date(a.savedAt);
    });
  }

  // Check if a route exists offline
  hasOfflineRoute(routeId) {
    const routes = this.getOfflineRoutes();
    return routes.some((route) => route.routeId === routeId);
  }

  // Get storage usage information
  getStorageInfo() {
    try {
      const routes = this.getOfflineRoutes();
      const totalSize = new Blob([JSON.stringify(routes)]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      return {
        routeCount: routes.length,
        maxRoutes: this.maxRoutes,
        totalSize,
        maxSize,
        usagePercentage: (totalSize / maxSize) * 100,
        availableSpace: maxSize - totalSize,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return null;
    }
  }

  // Clean up old routes to free space
  cleanupOldRoutes() {
    try {
      const routes = this.getOfflineRoutesByDate();
      const storageInfo = this.getStorageInfo();

      if (storageInfo && storageInfo.usagePercentage > 80) {
        // Remove oldest routes until we're under 70% usage
        const routesToKeep = [];
        let currentSize = 0;

        for (const route of routes) {
          const routeSize = new Blob([JSON.stringify(route)]).size;
          if (currentSize + routeSize < storageInfo.maxSize * 0.7) {
            routesToKeep.push(route);
            currentSize += routeSize;
          } else {
            break;
          }
        }

        localStorage.setItem(this.storageKey, JSON.stringify(routesToKeep));

        return {
          success: true,
          removedCount: routes.length - routesToKeep.length,
          message: `Cleaned up ${
            routes.length - routesToKeep.length
          } old routes`,
        };
      }

      return {
        success: true,
        message: "No cleanup needed",
      };
    } catch (error) {
      console.error("Failed to cleanup old routes:", error);
      return {
        success: false,
        error: "Failed to cleanup old routes",
      };
    }
  }

  // Export offline routes as JSON
  exportOfflineRoutes() {
    try {
      const routes = this.getOfflineRoutes();
      const dataStr = JSON.stringify(routes, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `offline-routes-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      return {
        success: true,
        message: "Offline routes exported successfully",
      };
    } catch (error) {
      console.error("Failed to export offline routes:", error);
      return {
        success: false,
        error: "Failed to export offline routes",
      };
    }
  }

  // Import offline routes from JSON
  importOfflineRoutes(file) {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedRoutes = JSON.parse(e.target.result);
            const currentRoutes = this.getOfflineRoutes();

            // Merge routes, avoiding duplicates
            const existingIds = new Set(currentRoutes.map((r) => r.routeId));
            const newRoutes = importedRoutes.filter(
              (route) => !existingIds.has(route.routeId)
            );

            const mergedRoutes = [...currentRoutes, ...newRoutes];

            // Limit to max routes
            if (mergedRoutes.length > this.maxRoutes) {
              mergedRoutes.splice(this.maxRoutes);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(mergedRoutes));

            resolve({
              success: true,
              importedCount: newRoutes.length,
              message: `Imported ${newRoutes.length} routes`,
            });
          } catch (error) {
            console.error("Failed to parse imported routes:", error);
            resolve({
              success: false,
              error: "Invalid file format",
            });
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error("Failed to import offline routes:", error);
        resolve({
          success: false,
          error: "Failed to import routes",
        });
      }
    });
  }
}

// Create singleton instance
const offlineRouteManager = new OfflineRouteManager();
export default offlineRouteManager;
