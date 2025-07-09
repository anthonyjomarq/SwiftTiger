const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database');
    
    // Force sync to recreate tables
    console.log('🔄 Creating database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully');
    
    // Wait a moment for tables to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'Main Administrator',
      email: 'admin@swifttiger.com',
      password: 'Admin123!',
      role: 'admin',
      isMainAdmin: true,
      isActive: true
    });
    
    console.log('✅ Admin user created successfully');
    const adminId = adminUser.id;
    
    // Create technician users
    console.log('👥 Creating technician users...');
    const technicians = [
      {
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@swifttiger.com',
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@swifttiger.com',
      },
      {
        name: 'Jose Martinez',
        email: 'jose.martinez@swifttiger.com',
      },
      {
        name: 'Ana Morales',
        email: 'ana.morales@swifttiger.com',
      },
      {
        name: 'Miguel Rivera',
        email: 'miguel.rivera@swifttiger.com',
      },
      {
        name: 'Isabella Gonzalez',
        email: 'isabella.gonzalez@swifttiger.com',
      },
      {
        name: 'David Hernandez',
        email: 'david.hernandez@swifttiger.com',
      }
    ];
    
    for (const technician of technicians) {
      await User.create({
        name: technician.name,
        email: technician.email,
        password: 'Technician123!',
        role: 'technician',
        isMainAdmin: false,
        isActive: true,
        createdBy: adminId
      });
      console.log(`✅ Created technician: ${technician.name}`);
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Admin: admin@swifttiger.com / Admin123!');
    console.log('Technicians: [name]@swifttiger.com / Technician123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase();