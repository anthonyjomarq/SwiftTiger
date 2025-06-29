const { pool } = require("../database");

const migrateJobUpdates = async () => {
  try {
    console.log("Adding job updates table and updating jobs table...");

    // Add last_activity column to jobs table
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Create job_updates table
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

    // Add indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_updates_job_id ON job_updates(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_updates_created_at ON job_updates(created_at DESC);
    `);

    console.log("Job updates migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateJobUpdates()
    .then(() => {
      console.log("Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateJobUpdates };
