const validateEnvironment = () => {
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'CORS_ORIGIN'
  ];

  const optionalVars = [
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_ROUTES_API_KEY'
  ];

  const missing = [];
  const warnings = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables and warn if missing
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Validate specific environment values
  const validationErrors = [];

  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    validationErrors.push('NODE_ENV must be one of: development, production, test');
  }

  if (process.env.PORT && (isNaN(process.env.PORT) || parseInt(process.env.PORT) <= 0)) {
    validationErrors.push('PORT must be a positive number');
  }

  if (process.env.DB_PORT && (isNaN(process.env.DB_PORT) || parseInt(process.env.DB_PORT) <= 0)) {
    validationErrors.push('DB_PORT must be a positive number');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    validationErrors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Validate CORS origin format
  if (process.env.CORS_ORIGIN && process.env.NODE_ENV === 'production') {
    try {
      new URL(process.env.CORS_ORIGIN);
    } catch (error) {
      validationErrors.push('CORS_ORIGIN must be a valid URL in production');
    }
  }

  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease ensure all required environment variables are set in your .env file.');
    process.exit(1);
  }

  if (validationErrors.length > 0) {
    console.error('❌ Environment validation errors:');
    validationErrors.forEach(error => {
      console.error(`   - ${error}`);
    });
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('Some features may not work without these variables.');
  }

  console.log('✅ Environment validation passed');
  
  // Log configuration summary (without sensitive data)
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Port: ${process.env.PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`   CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`   Google Places API: ${process.env.GOOGLE_PLACES_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   Google Routes API: ${process.env.GOOGLE_ROUTES_API_KEY ? 'Configured' : 'Not configured'}`);
};

module.exports = { validateEnvironment };