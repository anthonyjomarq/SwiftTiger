const { pool } = require("../database");

const addLocationFields = async () => {
  try {
    console.log("Adding location fields to database...");

    // Add location fields to customers table
    await pool.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP;
    `);

    // Add scheduling fields to jobs table
    await pool.query(`
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS scheduled_date DATE,
      ADD COLUMN IF NOT EXISTS scheduled_time TIME,
      ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 60,
      ADD COLUMN IF NOT EXISTS route_order INTEGER;
    `);

    // Create technician_locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS technician_locations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    console.log("Location fields migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addLocationFields()
    .then(() => {
      console.log("Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { addLocationFields };
