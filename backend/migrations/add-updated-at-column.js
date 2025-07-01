/**
 * Migration to add updated_at column to users table
 * This migration adds the missing updated_at column that the code expects
 */

const { pool } = require("../database");

const addUpdatedAtColumn = async () => {
  const client = await pool.connect();

  try {
    console.log("Adding updated_at column to users table...");

    await client.query("BEGIN");

    // Add updated_at column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Update existing records to have updated_at set to created_at
    await client.query(`
      UPDATE users 
      SET updated_at = created_at 
      WHERE updated_at IS NULL;
    `);

    await client.query("COMMIT");
    console.log("Successfully added updated_at column to users table!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration error:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addUpdatedAtColumn()
    .then(() => {
      console.log("Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { addUpdatedAtColumn };
