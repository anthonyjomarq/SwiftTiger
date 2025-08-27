import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { sequelize } from '../models/index.js';

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.DB_NAME = 'swifttiger_test';
  
  try {
    await sequelize.authenticate();
    console.log('Test database connection established.');
  } catch (error) {
    console.error('Unable to connect to test database:', error);
  }
});

beforeEach(async () => {
  // Clean up database before each test
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});