const { sequelize } = require('../models');
const logger = require('../utils/logger');

const runMigrations = async () => {
  try {
    logger.info('🔄 Starting database migrations...');
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
    
    // Sync models (create/update tables)
    await sequelize.sync({ alter: true });
    logger.info('✅ Database migrations completed successfully');
    
    // Close connection
    await sequelize.close();
    logger.info('🔌 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  }
};

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };