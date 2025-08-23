// src/utils/database.ts
import { Sequelize, QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Database connection status type
export type ConnectionStatus = "connected" | "disconnected" | "error";

// Database health check result
export interface DatabaseHealthCheck {
  status: ConnectionStatus;
  message: string;
  timestamp: Date;
  responseTime?: number;
  version?: string;
}

// Database statistics interface
export interface DatabaseStats {
  totalConnections: number;
  activeConnections: number;
  databaseSize?: string;
  uptime?: string;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private sequelize: Sequelize;
  private isConnected: boolean = false;

  private constructor(sequelizeInstance: Sequelize) {
    this.sequelize = sequelizeInstance;
  }

  // Singleton pattern
  public static getInstance(sequelizeInstance?: Sequelize): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!sequelizeInstance) {
        throw new Error("Sequelize instance required for first initialization");
      }
      DatabaseManager.instance = new DatabaseManager(sequelizeInstance);
    }
    return DatabaseManager.instance;
  }

  // Connect to database with retry logic
  public async connect(
    retryConfig: RetryConfig = {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    }
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        await this.sequelize.authenticate();
        this.isConnected = true;
        console.log(
          `Database connection established successfully (attempt ${attempt})`
        );
        return;
      } catch (error) {
        lastError = error as Error;
        this.isConnected = false;

        if (attempt === retryConfig.maxRetries) {
          console.error(
            `Failed to connect after ${retryConfig.maxRetries} attempts:`,
            error
          );
          break;
        }

        const delay =
          retryConfig.delayMs *
          Math.pow(retryConfig.backoffMultiplier, attempt - 1);
        console.warn(
          `Connection attempt ${attempt} failed, retrying in ${delay}ms...`
        );
        await this.sleep(delay);
      }
    }

    throw new Error(`Unable to connect to database: ${lastError?.message}`);
  }

  // Graceful disconnect
  public async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      this.isConnected = false;
      console.log("Database connection closed successfully");
    } catch (error) {
      console.error("Error closing database connection:", error);
      throw error;
    }
  }

  // Health check with detailed information
  public async healthCheck(): Promise<DatabaseHealthCheck> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Test basic connectivity
      await this.sequelize.authenticate();

      const responseTime = Date.now() - startTime;

      // Get database version
      let version: string | undefined;
      try {
        if (this.sequelize.getDialect() === "postgres") {
          const result = (await this.sequelize.query(
            "SELECT version() as version",
            { type: QueryTypes.SELECT }
          )) as Array<{ version: string }>;
          version = result[0]?.version;
        } else if (this.sequelize.getDialect() === "sqlite") {
          const result = (await this.sequelize.query(
            "SELECT sqlite_version() as version",
            { type: QueryTypes.SELECT }
          )) as Array<{ version: string }>;
          version = `SQLite ${result[0]?.version}`;
        }
      } catch (versionError) {
        console.warn("Could not retrieve database version:", versionError);
      }

      return {
        status: "connected",
        message: "Database is healthy and responsive",
        timestamp,
        responseTime,
        version,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: "error",
        message: `Database health check failed: ${(error as Error).message}`,
        timestamp,
        responseTime,
      };
    }
  }

  // Get database statistics
  public async getStats(): Promise<DatabaseStats> {
    const stats: DatabaseStats = {
      totalConnections: 0,
      activeConnections: 0,
    };

    try {
      if (this.sequelize.getDialect() === "postgres") {
        // Get connection statistics for PostgreSQL
        const connectionResult = (await this.sequelize.query(
          `
          SELECT 
            sum(numbackends) as active_connections,
            current_setting('max_connections')::int as max_connections
          FROM pg_stat_database 
          WHERE datname = current_database()
        `,
          { type: QueryTypes.SELECT }
        )) as Array<{
          active_connections: number;
          max_connections: number;
        }>;

        if (connectionResult.length > 0) {
          stats.activeConnections = connectionResult[0].active_connections || 0;
          stats.totalConnections = connectionResult[0].max_connections || 0;
        }

        // Get database size
        const sizeResult = (await this.sequelize.query(
          `
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `,
          { type: QueryTypes.SELECT }
        )) as Array<{ size: string }>;

        if (sizeResult.length > 0) {
          stats.databaseSize = sizeResult[0].size;
        }

        // Get uptime
        const uptimeResult = (await this.sequelize.query(
          `
          SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
        `,
          { type: QueryTypes.SELECT }
        )) as Array<{ uptime: string }>;

        if (uptimeResult.length > 0) {
          stats.uptime = uptimeResult[0].uptime;
        }
      } else if (this.sequelize.getDialect() === "sqlite") {
        // SQLite doesn't have the same connection concepts
        stats.activeConnections = 1; // SQLite typically has one connection
        stats.totalConnections = 1;
      }
    } catch (error) {
      console.warn("Could not retrieve database statistics:", error);
    }

    return stats;
  }

  // Sync database models
  public async syncModels(
    force: boolean = false,
    alter: boolean = false
  ): Promise<void> {
    try {
      console.log(
        `Syncing database models (force: ${force}, alter: ${alter})...`
      );
      await this.sequelize.sync({ force, alter });
      console.log("Database models synced successfully");
    } catch (error) {
      console.error("Error syncing database models:", error);
      throw error;
    }
  }

  // Run migrations (if using Sequelize CLI)
  public async runMigrations(): Promise<void> {
    try {
      console.log("Running database migrations...");
      // Note: This is a placeholder. In practice, you'd typically use Sequelize CLI
      // or implement your own migration runner
      console.log("Migration runner not implemented - use Sequelize CLI");
    } catch (error) {
      console.error("Error running migrations:", error);
      throw error;
    }
  }

  // Test query execution
  public async testQuery(): Promise<boolean> {
    try {
      const result = await this.sequelize.query("SELECT 1 as test", {
        type: QueryTypes.SELECT,
      });
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error("Test query failed:", error);
      return false;
    }
  }

  // Get connection status
  public get connectionStatus(): ConnectionStatus {
    return this.isConnected ? "connected" : "disconnected";
  }

  // Get Sequelize instance
  public get instance(): Sequelize {
    return this.sequelize;
  }

  // Utility method for delays
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create and export the database manager instance
export const databaseManager = DatabaseManager.getInstance(sequelize);

// Convenience functions
export const connectDatabase = async (
  retryConfig?: RetryConfig
): Promise<void> => {
  return databaseManager.connect(retryConfig);
};

export const disconnectDatabase = async (): Promise<void> => {
  return databaseManager.disconnect();
};

export const checkDatabaseHealth = async (): Promise<DatabaseHealthCheck> => {
  return databaseManager.healthCheck();
};

export const getDatabaseStats = async (): Promise<DatabaseStats> => {
  return databaseManager.getStats();
};

export const syncDatabaseModels = async (
  force?: boolean,
  alter?: boolean
): Promise<void> => {
  return databaseManager.syncModels(force, alter);
};

// Graceful shutdown handler
export const setupGracefulShutdown = (): void => {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await disconnectDatabase();
      process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};
