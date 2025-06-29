const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "swifttiger",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Users table with role
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'technician',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Jobs table with assigned_to field
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Permissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Role permissions mapping
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role, permission_id)
      )
    `);

    // Insert default permissions
    const defaultPermissions = [
      // Customer permissions
      {
        name: "customers.view",
        resource: "customers",
        action: "view",
        description: "View customers",
      },
      {
        name: "customers.create",
        resource: "customers",
        action: "create",
        description: "Create customers",
      },
      {
        name: "customers.edit",
        resource: "customers",
        action: "edit",
        description: "Edit customers",
      },
      {
        name: "customers.delete",
        resource: "customers",
        action: "delete",
        description: "Delete customers",
      },

      // Job permissions
      {
        name: "jobs.view",
        resource: "jobs",
        action: "view",
        description: "View all jobs",
      },
      {
        name: "jobs.view_assigned",
        resource: "jobs",
        action: "view_assigned",
        description: "View assigned jobs only",
      },
      {
        name: "jobs.create",
        resource: "jobs",
        action: "create",
        description: "Create jobs",
      },
      {
        name: "jobs.edit",
        resource: "jobs",
        action: "edit",
        description: "Edit jobs",
      },
      {
        name: "jobs.delete",
        resource: "jobs",
        action: "delete",
        description: "Delete jobs",
      },
      {
        name: "jobs.assign",
        resource: "jobs",
        action: "assign",
        description: "Assign jobs to technicians",
      },
      {
        name: "jobs.update_status",
        resource: "jobs",
        action: "update_status",
        description: "Update job status",
      },

      // User permissions
      {
        name: "users.view",
        resource: "users",
        action: "view",
        description: "View users",
      },
      {
        name: "users.create",
        resource: "users",
        action: "create",
        description: "Create users",
      },
      {
        name: "users.edit",
        resource: "users",
        action: "edit",
        description: "Edit users",
      },
      {
        name: "users.delete",
        resource: "users",
        action: "delete",
        description: "Delete users",
      },
    ];

    // Insert permissions
    for (const perm of defaultPermissions) {
      await pool.query(
        `
        INSERT INTO permissions (name, resource, action, description) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (name) DO NOTHING
      `,
        [perm.name, perm.resource, perm.action, perm.description]
      );
    }

    // Assign permissions to roles
    const rolePermissions = {
      admin: ["*"], // Admin gets all permissions
      dispatcher: [
        "customers.view",
        "customers.create",
        "customers.edit",
        "jobs.view",
        "jobs.create",
        "jobs.edit",
        "jobs.assign",
        "jobs.update_status",
        "users.view",
      ],
      technician: [
        "customers.view",
        "jobs.view_assigned",
        "jobs.update_status",
      ],
    };

    // Assign permissions to roles
    for (const [role, permissions] of Object.entries(rolePermissions)) {
      for (const permName of permissions) {
        if (permName === "*") {
          // Admin gets all permissions
          await pool.query(
            `
            INSERT INTO role_permissions (role, permission_id)
            SELECT $1, id FROM permissions
            ON CONFLICT DO NOTHING
          `,
            [role]
          );
        } else {
          await pool.query(
            `
            INSERT INTO role_permissions (role, permission_id)
            SELECT $1, id FROM permissions WHERE name = $2
            ON CONFLICT DO NOTHING
          `,
            [role, permName]
          );
        }
      }
    }

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
