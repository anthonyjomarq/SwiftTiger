const { sequelize } = require('../models');
require('dotenv').config();

const createTechnicians = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

    // Wait for tables to be created and use raw SQL
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if technicians already exist
    const [existingTechnicians] = await sequelize.query(
      "SELECT * FROM users WHERE role = 'technician' LIMIT 1"
    );
    
    if (existingTechnicians.length > 0) {
      console.log('Technicians already exist');
      process.exit(0);
    }

    // Create technicians using raw SQL
    const technicians = [
      {
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      },
      {
        name: 'Jose Martinez',
        email: 'jose.martinez@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      },
      {
        name: 'Ana Morales',
        email: 'ana.morales@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      },
      {
        name: 'Miguel Rivera',
        email: 'miguel.rivera@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      },
      {
        name: 'Isabella Gonzalez',
        email: 'isabella.gonzalez@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      },
      {
        name: 'David Hernandez',
        email: 'david.hernandez@swifttiger.com',
        password: '$2a$12$qs3.WFbG6UgOtlkZDDNOCeaqAcfEUCA50QU/1Y3mCjwr9ikQJ0EfG', // Technician123!
      }
    ];

    // Get admin user ID for createdBy field
    const [adminUser] = await sequelize.query(
      "SELECT id FROM users WHERE \"isMainAdmin\" = true LIMIT 1"
    );
    
    const adminId = adminUser[0].id;

    for (const technician of technicians) {
      await sequelize.query(`
        INSERT INTO users (id, name, email, password, role, "isMainAdmin", "isActive", "createdBy", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          '${technician.name}',
          '${technician.email}',
          '${technician.password}',
          'technician',
          false,
          true,
          '${adminId}',
          NOW(),
          NOW()
        )
      `);
      console.log(`Created technician: ${technician.name} (${technician.email})`);
    }

    console.log('All technicians created successfully');
    console.log('Default password for all technicians: Technician123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating technicians:', error);
    process.exit(1);
  }
};

createTechnicians();