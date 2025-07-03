/**
 * Unit Tests for SwiftTiger Backend
 * Tests individual functions and modules
 */

describe('Backend Unit Tests', () => {
  describe('Utilities', () => {
    test('API Response helpers work correctly', () => {
      const { successResponse, errorResponse } = require('../utils/apiResponse');
      
      const success = successResponse({ id: 1 }, 'Success message');
      expect(success.success).toBe(true);
      expect(success.data.id).toBe(1);
      expect(success.message).toBe('Success message');
      
      const error = errorResponse('Error message', 400);
      expect(error.success).toBe(false);
      expect(error.message).toBe('Error message');
      expect(error.statusCode).toBe(400);
    });

    test('Logger configuration is valid', () => {
      const { log } = require('../utils/logger');
      expect(log).toBeDefined();
      expect(typeof log.info).toBe('function');
      expect(typeof log.error).toBe('function');
      expect(typeof log.warn).toBe('function');
    });
  });

  describe('Validators', () => {
    test('Job validator functions exist', () => {
      const jobValidators = require('../validators/jobValidator');
      expect(jobValidators.validateCreateJob).toBeDefined();
      expect(jobValidators.validateUpdateJob).toBeDefined();
      expect(jobValidators.validateJobStatus).toBeDefined();
    });

    test('Customer validator functions exist', () => {
      const customerValidators = require('../validators/customerValidator');
      expect(customerValidators.validateCreateCustomer).toBeDefined();
      expect(customerValidators.validateUpdateCustomer).toBeDefined();
    });
  });

  describe('Services', () => {
    test('Auth service functions exist', () => {
      const authService = require('../services/authService');
      expect(authService.generateToken).toBeDefined();
      expect(authService.verifyToken).toBeDefined();
      expect(authService.generateRefreshToken).toBeDefined();
    });

    test('Job service functions exist', () => {
      const jobService = require('../services/jobService');
      expect(jobService.createJob).toBeDefined();
      expect(jobService.getJobs).toBeDefined();
      expect(jobService.updateJob).toBeDefined();
    });

    test('User service functions exist', () => {
      const userService = require('../services/userService');
      expect(userService.createUser).toBeDefined();
      expect(userService.getUserById).toBeDefined();
      expect(userService.updateUser).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('Required environment variables are validated', () => {
      const { validateEnv } = require('../utils/envValidator');
      
      // This should not throw an error in test environment
      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('Middleware', () => {
    test('Permission middleware exists', () => {
      const { requirePermission } = require('../middleware/permissions');
      expect(typeof requirePermission).toBe('function');
    });

    test('Validation middleware exists', () => {
      const validation = require('../middleware/validation');
      expect(validation.handleValidationErrors).toBeDefined();
      expect(validation.sanitizeRequest).toBeDefined();
    });

    test('Job workflow middleware exists', () => {
      const jobWorkflow = require('../middleware/jobWorkflow');
      expect(jobWorkflow.validateJobWorkflow).toBeDefined();
      expect(jobWorkflow.validateJobAssignment).toBeDefined();
    });
  });

  describe('Route Planning', () => {
    test('Route planning module exists', () => {
      const routePlanning = require('../routePlanning');
      expect(routePlanning.RouteOptimizer).toBeDefined();
    });

    test('Fuel tracking module exists', () => {
      const fuelTracking = require('../fuelTracking');
      expect(fuelTracking.FuelTracker).toBeDefined();
    });
  });

  describe('Database Module', () => {
    test('Database connection module exports required functions', () => {
      const database = require('../database');
      expect(database.pool).toBeDefined();
      expect(database.initializeDatabase).toBeDefined();
    });
  });
});

describe('Configuration Tests', () => {
  test('Package.json has correct structure', () => {
    const packageJson = require('../package.json');
    expect(packageJson.name).toBe('swift-tiger-backend');
    expect(packageJson.version).toBeDefined();
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.scripts).toBeDefined();
  });

  test('All required dependencies are present', () => {
    const packageJson = require('../package.json');
    const requiredDeps = [
      'express',
      'cors',
      'bcryptjs',
      'jsonwebtoken',
      'pg',
      'socket.io',
      'winston',
      'express-validator',
      'express-rate-limit'
    ];
    
    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies[dep]).toBeDefined();
    });
  });
});