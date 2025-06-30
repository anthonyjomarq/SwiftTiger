import axios from "axios";

class MapsConfigService {
  constructor() {
    this.config = null;
    this.loading = false;
    this.error = null;
  }

  async loadConfig() {
    if (this.config) {
      return this.config;
    }

    if (this.loading) {
      // Wait for existing request to complete
      while (this.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.config;
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await axios.get("/api/maps-config");
      this.config = response.data;
      return this.config;
    } catch (error) {
      this.error =
        error.response?.data?.error || "Failed to load maps configuration";
      console.error("Maps config error:", error);
      throw new Error(this.error);
    } finally {
      this.loading = false;
    }
  }

  getConfig() {
    return this.config;
  }

  getError() {
    return this.error;
  }

  clearCache() {
    this.config = null;
    this.error = null;
  }
}

// Export singleton instance
export const mapsConfigService = new MapsConfigService();
