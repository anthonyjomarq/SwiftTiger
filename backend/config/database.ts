import { Sequelize, Options as SequelizeOptions } from "sequelize";
import { config } from "dotenv";

config();

type DatabaseDialect = "sqlite" | "postgres";

interface DatabaseConfig extends Omit<SequelizeOptions, "dialect"> {
  dialect: DatabaseDialect;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  storage?: string;
  logging?: boolean | ((sql: string, timing?: number) => void);
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(
        `Environment variable ${key} is required but not defined`
      );
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(
      `Environment variable ${key} mus be a valid number, got: ${value}`
    );
  }
  return parsed;
};

const getDatabaseConfig = (): DatabaseConfig => {
  const dialect = (process.env.DB_DIALECT || "postgres") as DatabaseDialect;
  const isDevelopment = process.env.NODE_ENV === "development";

  const baseConfig: Partial<DatabaseConfig> = {
    logging: isDevelopment ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
    },
    ...(dialect !== "sqlite" && { timezone: "-4:00" }),
  };

  switch (dialect) {
    case "sqlite":
      return {
        ...baseConfig,
        dialect: "sqlite",
        storage: getEnvVar("DB_STORAGE", "./database.sqlite"),
      } as DatabaseConfig;
    case "postgres":
      return {
        ...baseConfig,
        dialect: "postgres",
        host: getEnvVar("DB_HOST", "localhost"),
        port: getEnvNumber("DB_PORT", 5432),
        database: getEnvVar("DB_NAME"),
        username: getEnvVar("DB_USER"),
        password: getEnvVar("DB_PASSWORD"),
        pool: {
          max: getEnvNumber("DB_POOL_MAX", 10),
          min: getEnvNumber("DB_POOL_MIN", 0),
          acquire: getEnvNumber("DB_POOL_ACQUIRE", 30000),
          idle: getEnvNumber("DB_POOL_IDLE", 10000),
        },
        dialectOptions: {
          ssl:
            process.env.DB_SSL === "true"
              ? {
                  require: true,
                  rejectUnathorized: false,
                }
              : false,
        },
      } as DatabaseConfig;

    default:
      throw new Error(`Unsupported database dialect: ${dialect}`);
  }
};

const createSequelizeInstance = (): Sequelize => {
  try {
    const config = getDatabaseConfig();
    const sequelize = new Sequelize(config);

    // Add connection event listeners
    sequelize.addHook("beforeConnect", (config) => {
      const dialect = (config as any).dialect || "database";
      console.log(`Attempting to connect to ${dialect} database...`);
    });

    sequelize.addHook("afterConnect", (connection, config) => {
      const dialect = (config as any).dialect || "database";
      console.log(`Successfully connected to ${dialect} database`);
    });

    return sequelize;
  } catch (error) {
    console.error("Failed to create Sequelize instance:", error);
    throw error;
  }
};

export const sequelize = createSequelizeInstance();

// Export configuration function for testing or advanced usage
export { getDatabaseConfig };

// Export types for use in other modules
export type { DatabaseConfig, DatabaseDialect };
