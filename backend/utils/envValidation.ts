import process from "process";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production" | "test";
      PORT?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      CORS_ORIGIN?: string;
      GOOGLE_PLACES_API_KEY?: string;
      GOOGLE_ROUTES_API_KEY?: string;
      LOG_LEVEL?: "error" | "warn" | "info" | "debug";
    }
  }
}

export interface ValidationResult {
  missing: string[];
  warnings: string[];
  validationErrors: string[];
}

export interface EnvironmentConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  GOOGLE_PLACES_API_KEY?: string;
  GOOGLE_ROUTES_API_KEY?: string;
}

type RequiredEnvVar = keyof Omit<
  EnvironmentConfig,
  "GOOGLE_PLACES_API_KEY" | "GOOGLE_ROUTES_API_KEY"
>;
type OptionalEnvVar = "GOOGLE_PLACES_API_KEY" | "GOOGLE_ROUTES_API_KEY";

const REQUIRED_VARS: RequiredEnvVar[] = [
  "NODE_ENV",
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CORS_ORIGIN",
];

const OPTIONAL_VARS: OptionalEnvVar[] = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_ROUTES_API_KEY",
];

const VALID_NODE_ENVS: EnvironmentConfig["NODE_ENV"][] = [
  "development",
  "production",
  "test",
];

function validateEnvValue(
  varName: string,
  value: string | undefined
): string | null {
  if (!value) return null;

  switch (varName) {
    case "NODE_ENV":
      return VALID_NODE_ENVS.includes(value as EnvironmentConfig["NODE_ENV"])
        ? null
        : "NODE_ENV must be one of: development, production, test";

    case "PORT":
    case "DB_PORT":
      const port = parseInt(value, 10);
      return isNaN(port) || port <= 0
        ? `${varName} must be a positive number`
        : null;

    case "JWT_SECRET":
      return value.length < 32
        ? "JWT_SECRET must be at least 32 characters long"
        : null;

    case "CORS_ORIGIN":
      if (process.env.NODE_ENV === "production") {
        try {
          new URL(value);
          return null;
        } catch {
          return "CORS_ORIGIN must be a valid URL in production";
        }
      }
      return null;

    default:
      return null;
  }
}

function checkEnvironmentVariables(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const validationErrors: string[] = [];

  REQUIRED_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      const error = validateEnvValue(varName, value);
      if (error) {
        validationErrors.push(error);
      }
    }
  });

  OPTIONAL_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  return { missing, warnings, validationErrors };
}

function logConfigurationSummary(): void {
  console.log("📋 Configuration Summary:");
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Port: ${process.env.PORT}`);
  console.log(
    `   Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`
  );
  console.log(`   CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(
    `   Google Places API: ${
      process.env.GOOGLE_PLACES_API_KEY ? "Configured" : "Not configured"
    }`
  );
  console.log(
    `   Google Routes API: ${
      process.env.GOOGLE_ROUTES_API_KEY ? "Configured" : "Not configured"
    }`
  );
}

/**
 * Validates all environment variables and exits process on critical errors
 * @throws {never} Exits process with code 1 if validation fails
 */
export function validateEnvironment(): void {
  const { missing, warnings, validationErrors } = checkEnvironmentVariables();

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\nPlease ensure all required environment variables are set in your .env file."
    );
    process.exit(1);
  }

  if (validationErrors.length > 0) {
    console.error("❌ Environment validation errors:");
    validationErrors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Optional environment variables not set:");
    warnings.forEach((varName) => {
      console.warn(`   - ${varName}`);
    });
    console.warn("Some features may not work without these variables.");
  }

  console.log("✅ Environment validation passed");
  logConfigurationSummary();
}

/**
 * Validates environment variables and returns results without exiting process
 * Useful for testing or programmatic validation
 */
export function validateEnvironmentSafe(): ValidationResult & {
  isValid: boolean;
} {
  const result = checkEnvironmentVariables();
  const isValid =
    result.missing.length === 0 && result.validationErrors.length === 0;

  return {
    ...result,
    isValid,
  };
}

export function hasValidEnvironment(): boolean {
  const { missing, validationErrors } = checkEnvironmentVariables();
  return missing.length === 0 && validationErrors.length === 0;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!hasValidEnvironment()) {
    throw new Error("Environment validation must pass before accessing config");
  }
  return {
    NODE_ENV: process.env.NODE_ENV as EnvironmentConfig["NODE_ENV"],
    PORT: parseInt(process.env.PORT!, 10),
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: parseInt(process.env.DB_PORT!, 10),
    DB_NAME: process.env.DB_NAME!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
    CORS_ORIGIN: process.env.CORS_ORIGIN!,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    GOOGLE_ROUTES_API_KEY: process.env.GOOGLE_ROUTES_API_KEY,
  };
}
