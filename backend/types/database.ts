// src/types/database.ts
import {
  Sequelize,
  Model,
  ModelStatic,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";

// Base model interface that all your models should extend
export interface BaseModelAttributes {
  id: CreationOptional<number>;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  deletedAt: CreationOptional<Date | null>;
}

// Base model class that provides common functionality
export class BaseModel<M extends Model> extends Model<
  InferAttributes<M>,
  InferCreationAttributes<M>
> {
  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

// Database connection configuration types
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: "postgres" | "sqlite";
  ssl?: boolean;
}

// Query result types for common operations
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

// Migration interface
export interface Migration {
  up: (
    queryInterface: any,
    Sequelize: typeof import("sequelize")
  ) => Promise<void>;
  down: (
    queryInterface: any,
    Sequelize: typeof import("sequelize")
  ) => Promise<void>;
}

// Model registry type for better type safety
export interface ModelRegistry {
  [modelName: string]: ModelStatic<Model>;
}

// Database error types
export class DatabaseConnectionError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

export class DatabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "DatabaseQueryError";
  }
}

// Environment variable types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database configuration
      DB_DIALECT?: "postgres" | "sqlite";
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      DB_STORAGE?: string; // For SQLite
      DB_SSL?: "true" | "false";

      // Connection pool settings
      DB_POOL_MAX?: string;
      DB_POOL_MIN?: string;
      DB_POOL_ACQUIRE?: string;
      DB_POOL_IDLE?: string;

      // Application environment
      NODE_ENV?: "development" | "production" | "test";
      PORT?: string;

      // Logging
      LOG_LEVEL?: "error" | "warn" | "info" | "debug";
    }
  }
}
