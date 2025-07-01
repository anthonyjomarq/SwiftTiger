/**
 * Migration: Add priority column to jobs table
 * Adds priority field to support job priority levels (low, normal, high, urgent, emergency)
 */

const { pool } = require("../database");
const { log } = require("../utils/logger");

/**
 * Apply the migration - Add priority column to jobs table
 */
async function up() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    log.info("Adding priority column to jobs table...");
    
    // Add priority column with default value
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'
    `);
    
    // Add check constraint for valid priority values
    await client.query(`
      ALTER TABLE jobs 
      ADD CONSTRAINT IF NOT EXISTS jobs_priority_check 
      CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'emergency'))
    `);
    
    // Create index for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_priority 
      ON jobs(priority)
    `);
    
    await client.query("COMMIT");
    log.info("✅ Successfully added priority column to jobs table");
    
  } catch (error) {
    await client.query("ROLLBACK");
    log.error("❌ Failed to add priority column:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rollback the migration - Remove priority column from jobs table
 */
async function down() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    log.info("Removing priority column from jobs table...");
    
    // Drop index
    await client.query(`
      DROP INDEX IF EXISTS idx_jobs_priority
    `);
    
    // Drop constraint
    await client.query(`
      ALTER TABLE jobs 
      DROP CONSTRAINT IF EXISTS jobs_priority_check
    `);
    
    // Drop column
    await client.query(`
      ALTER TABLE jobs 
      DROP COLUMN IF EXISTS priority
    `);
    
    await client.query("COMMIT");
    log.info("✅ Successfully removed priority column from jobs table");
    
  } catch (error) {
    await client.query("ROLLBACK");
    log.error("❌ Failed to remove priority column:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  up,
  down,
  description: "Add priority column to jobs table with constraint and index"
};