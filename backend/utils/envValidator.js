/**
 * Environment Variables Validator
 * Validates required environment variables for production deployment
 */

const { log } = require('./logger');

/**
 * Required environment variables with validation rules
 */
const ENV_REQUIREMENTS = {
  // Database Configuration
  DB_HOST: { required: true, description: 'Database host' },
  DB_PORT: { required: true, type: 'number', description: 'Database port' },
  DB_NAME: { required: true, description: 'Database name' },
  DB_USER: { required: true, description: 'Database user' },
  DB_PASSWORD: { required: true, description: 'Database password' },
  
  // Authentication
  JWT_SECRET: { 
    required: true, 
    minLength: 32, 
    description: 'JWT secret key (minimum 32 characters)' 
  },
  
  // Server Configuration
  PORT: { required: false, type: 'number', default: 5000, description: 'Server port' },
  NODE_ENV: { 
    required: true, 
    allowedValues: ['development', 'production', 'test'], 
    description: 'Node environment' 
  },
  
  // Optional but recommended for production
  FRONTEND_URL: { 
    required: false, 
    description: 'Frontend URL for CORS configuration' 
  },
  GOOGLE_MAPS_API_KEY: { 
    required: false, 
    description: 'Google Maps API key for route optimization' 
  },
  
  // Email Configuration (for password reset) - only required in production
  EMAIL_HOST: { 
    required: process.env.NODE_ENV === 'production', 
    description: 'SMTP host for email sending' 
  },
  EMAIL_PORT: { 
    required: process.env.NODE_ENV === 'production', 
    type: 'number', 
    description: 'SMTP port' 
  },
  EMAIL_USER: { 
    required: process.env.NODE_ENV === 'production', 
    description: 'Email username' 
  },
  EMAIL_PASSWORD: { 
    required: process.env.NODE_ENV === 'production', 
    description: 'Email password' 
  },
  EMAIL_FROM: { 
    required: process.env.NODE_ENV === 'production', 
    description: 'Email from address' 
  },
  
  // Logging
  LOG_LEVEL: { 
    required: false, 
    allowedValues: ['error', 'warn', 'info', 'debug'], 
    default: 'info',
    description: 'Logging level' 
  }
};

/**
 * Validates a single environment variable
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 * @param {object} rules - Validation rules
 * @returns {object} Validation result
 */
function validateEnvVar(key, value, rules) {
  const errors = [];
  
  // Check if required
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`${key} is required`);
    return { valid: false, errors };
  }
  
  // Skip further validation if not provided and not required
  if (!value || value.trim() === '') {
    return { valid: true, errors: [] };
  }
  
  // Type validation
  if (rules.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(`${key} must be a valid number`);
    }
  }
  
  // Minimum length validation
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${key} must be at least ${rules.minLength} characters long`);
  }
  
  // Allowed values validation
  if (rules.allowedValues && !rules.allowedValues.includes(value)) {
    errors.push(`${key} must be one of: ${rules.allowedValues.join(', ')}`);
  }
  
  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // JWT_SECRET should not be the default development value
    if (key === 'JWT_SECRET' && (
      value.includes('development') || 
      value.includes('secret-key') ||
      value.length < 32
    )) {
      errors.push(`${key} must be a secure random string in production (minimum 32 characters)`);
    }
    
    // Database password should not be default
    if (key === 'DB_PASSWORD' && (value === 'password' || value === 'admin')) {
      errors.push(`${key} should not use default password in production`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates all environment variables
 * @returns {object} Validation result with summary
 */
function validateEnvironment() {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    summary: {
      total: Object.keys(ENV_REQUIREMENTS).length,
      validated: 0,
      errors: 0,
      warnings: 0
    }
  };
  
  // Validate each environment variable
  for (const [key, rules] of Object.entries(ENV_REQUIREMENTS)) {
    const value = process.env[key];
    const validation = validateEnvVar(key, value, rules);
    
    results.summary.validated++;
    
    if (!validation.valid) {
      results.valid = false;
      results.errors.push(...validation.errors);
      results.summary.errors++;
    }
    
    // Check for missing optional but recommended variables
    if (!rules.required && (!value || value.trim() === '')) {
      if (key === 'GOOGLE_MAPS_API_KEY') {
        results.warnings.push(`${key} is not set - route optimization features will be limited`);
        results.summary.warnings++;
      } else if (key.startsWith('EMAIL_')) {
        results.warnings.push(`${key} is not set - password reset functionality may not work`);
        results.summary.warnings++;
      }
    }
  }
  
  return results;
}

/**
 * Sets default values for optional environment variables
 */
function setDefaults() {
  for (const [key, rules] of Object.entries(ENV_REQUIREMENTS)) {
    if (rules.default && (!process.env[key] || process.env[key].trim() === '')) {
      process.env[key] = rules.default.toString();
      log.info(`Set default value for ${key}: ${rules.default}`);
    }
  }
}

/**
 * Logs validation results
 * @param {object} results - Validation results
 */
function logValidationResults(results) {
  const { summary, errors, warnings } = results;
  
  log.info('Environment validation completed', {
    total: summary.total,
    validated: summary.validated,
    errors: summary.errors,
    warnings: summary.warnings,
    environment: process.env.NODE_ENV
  });
  
  if (errors.length > 0) {
    log.error('Environment validation errors:', errors);
  }
  
  if (warnings.length > 0) {
    log.warn('Environment validation warnings:', warnings);
  }
}

/**
 * Validates environment and exits if critical errors found
 */
function validateAndExit() {
  setDefaults();
  const results = validateEnvironment();
  logValidationResults(results);
  
  if (!results.valid) {
    log.error('Environment validation failed. Server cannot start.');
    process.exit(1);
  }
  
  return results;
}

module.exports = {
  validateEnvironment,
  validateAndExit,
  setDefaults,
  ENV_REQUIREMENTS
};