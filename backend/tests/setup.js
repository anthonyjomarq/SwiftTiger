const { sequelize } = require('../models');

// Setup test database
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Fresh database for tests
  } catch (error) {
    console.error('Test database setup failed:', error);
  }
});

// Cleanup after tests
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Test database cleanup failed:', error);
  }
});

// Clear database between tests
beforeEach(async () => {
  try {
    // Clear all tables in reverse order of dependencies
    await sequelize.query('TRUNCATE TABLE audit_logs CASCADE');
    await sequelize.query('TRUNCATE TABLE job_logs CASCADE');
    await sequelize.query('TRUNCATE TABLE jobs CASCADE');
    await sequelize.query('TRUNCATE TABLE customers CASCADE');
    await sequelize.query('TRUNCATE TABLE users CASCADE');
  } catch (error) {
    console.error('Test data cleanup failed:', error);
  }
});