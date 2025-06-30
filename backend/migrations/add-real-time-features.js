const { pool } = require("../database");

async function migrate() {
  try {
    console.log("Starting migration: add-real-time-features");

    // Add accuracy column to technician_locations if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'technician_locations' 
          AND column_name = 'accuracy'
        ) THEN
          ALTER TABLE technician_locations ADD COLUMN accuracy DECIMAL(10, 2);
        END IF;
      END $$;
    `);

    // Create shared_routes table
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

    // Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_technician_locations_user_id ON technician_locations(user_id);
      CREATE INDEX IF NOT EXISTS idx_shared_routes_token ON shared_routes(share_token);
      CREATE INDEX IF NOT EXISTS idx_shared_routes_expires_at ON shared_routes(expires_at);
    `);

    console.log("Migration completed successfully: add-real-time-features");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrate };
