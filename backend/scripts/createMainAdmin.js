const { sequelize } = require('../models');
require('dotenv').config();

const createMainAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

    // Wait for tables to be created and use raw SQL
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if main admin already exists
    const [existingAdmin] = await sequelize.query(
      "SELECT * FROM users WHERE \"isMainAdmin\" = true LIMIT 1"
    );
    
    if (existingAdmin.length > 0) {
      console.log('Main admin already exists:', existingAdmin[0].email);
      process.exit(0);
    }

    // Create main admin using raw SQL to avoid model issues
    await sequelize.query(`
      INSERT INTO users (id, name, email, password, role, "isMainAdmin", "isActive", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'Main Administrator',
        'admin@swifttiger.com',
        '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG',
        'admin',
        true,
        true,
        NOW(),
        NOW()
      )
    `);

    console.log('Main admin created successfully');
    console.log('Email: admin@swifttiger.com');
    console.log('Password: Admin123!');
    console.log('Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error creating main admin:', error);
    process.exit(1);
  }
};

createMainAdmin();