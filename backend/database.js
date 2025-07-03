/**
 * Database configuration and connection management
 * Handles PostgreSQL connection pool and database initialization
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */

const { Pool } = require("pg");
const { log, dbLogger } = require("./utils/logger");
require("dotenv").config();

/**
 * PostgreSQL connection pool configuration
 * Uses environment variables for database connection settings
 */
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "swifttiger",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
});

/**
 * Store the original query method for logging wrapper
 */
const originalQuery = pool.query.bind(pool);

/**
 * Enhanced query method with logging and performance monitoring
 *
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const queryWithLogging = async (text, params) => {
  const startTime = Date.now();
  try {
    const result = await originalQuery(text, params);
    const duration = Date.now() - startTime;

    // Log successful queries (only in debug mode or if duration > 1000ms)
    if (process.env.LOG_LEVEL === "debug" || duration > 1000) {
      dbLogger.query(text, params, duration);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    dbLogger.error(error, text, params);
    throw error;
  }
};

/**
 * Replace the original query method with enhanced logging version
 */
pool.query = queryWithLogging;

/**
 * Database connection event handlers
 */
pool.on("connect", () => {
  log.info("Connected to PostgreSQL database", {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "swifttiger",
  });
});

pool.on("error", (err) => {
  log.error("Unexpected error on idle client", err);
  process.exit(-1);
});

/**
 * Initialize database tables with proper schema
 * Creates all necessary tables if they don't exist
 *
 * @returns {Promise<void>}
 */
const initializeDatabase = async () => {
  try {
    // Users table with role and profile fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        company VARCHAR(255),
        notes TEXT,
        role VARCHAR(50) DEFAULT 'technician',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add profile columns if they don't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(50);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        geocoded_at TIMESTAMP,
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
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'emergency')),
        scheduled_date DATE,
        scheduled_time TIME,
        estimated_duration INTEGER DEFAULT 60,
        route_order INTEGER,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Job updates table for communication and activity tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_updates (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        update_type VARCHAR(50) DEFAULT 'comment',
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Technician locations table for tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS technician_locations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        accuracy DECIMAL(10, 2),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Shared routes table for route sharing functionality
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_routes (
        id SERIAL PRIMARY KEY,
        route_id VARCHAR(255) NOT NULL,
        share_token VARCHAR(255) UNIQUE NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Route assignments table for optimized daily routes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS route_assignments (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        technician_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        sequence_order INTEGER NOT NULL,
        estimated_travel_distance DECIMAL(10, 2) DEFAULT 0,
        estimated_travel_time INTEGER DEFAULT 0,
        estimated_arrival_time TIME,
        fuel_cost_estimate DECIMAL(10, 2) DEFAULT 0,
        actual_travel_distance DECIMAL(10, 2),
        actual_travel_time INTEGER,
        actual_arrival_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, technician_id, job_id)
      )
    `);

    // Create index for efficient route queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_route_assignments_date_tech 
      ON route_assignments(date, technician_id, sequence_order)
    `);

    // Technician skills and capabilities
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS service_area JSONB;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS home_location_lat DECIMAL(10, 8);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS home_location_lng DECIMAL(11, 8);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'van';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS max_daily_jobs INTEGER DEFAULT 8;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Job location and skill requirements
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address TEXT;
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_technician INTEGER REFERENCES users(id);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Technician schedule availability
    await pool.query(`
      CREATE TABLE IF NOT EXISTS technician_schedule (
        id SERIAL PRIMARY KEY,
        technician_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME DEFAULT '08:00',
        end_time TIME DEFAULT '17:00',
        status VARCHAR(50) DEFAULT 'available',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(technician_id, date)
      )
    `);

    // Job completion locations (track where technician was when marking job complete)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_completion_locations (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        technician_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        next_job_id INTEGER REFERENCES jobs(id),
        UNIQUE(job_id)
      )
    `);

    // Route optimization history and analytics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS route_optimization_runs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total_jobs INTEGER NOT NULL,
        total_technicians INTEGER NOT NULL,
        total_distance DECIMAL(10, 2) NOT NULL,
        total_fuel_cost DECIMAL(10, 2) NOT NULL,
        estimated_savings DECIMAL(10, 2),
        optimization_time_ms INTEGER,
        algorithm_version VARCHAR(50) DEFAULT '1.0',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fuel cost tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fuel_costs (
        id SERIAL PRIMARY KEY,
        technician_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        distance_miles DECIMAL(10, 2) NOT NULL,
        fuel_cost DECIMAL(10, 2) NOT NULL,
        cost_per_mile DECIMAL(10, 4) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fuel rate history for tracking rate changes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fuel_rate_history (
        id SERIAL PRIMARY KEY,
        cost_per_mile DECIMAL(10, 4) NOT NULL,
        effective_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Support tickets table for customer support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Support ticket responses/messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_updates_job_id ON job_updates(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_updates_created_at ON job_updates(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_technician_locations_user_id ON technician_locations(user_id);
      CREATE INDEX IF NOT EXISTS idx_shared_routes_token ON shared_routes(share_token);
      CREATE INDEX IF NOT EXISTS idx_shared_routes_expires_at ON shared_routes(expires_at);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON support_ticket_messages(created_at DESC);
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
      {
        name: "jobs.close",
        resource: "jobs",
        action: "close",
        description: "Close completed jobs",
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
        "jobs.edit",
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

/**
 * Export database utilities
 * @exports {Object} Database utilities including pool and initialization function
 */
module.exports = {
  pool,
  initializeDatabase,
};
