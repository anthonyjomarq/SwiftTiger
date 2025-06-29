const { pool } = require("../database");
require("dotenv").config();

const migrate = async () => {
  try {
    console.log("Running roles and permissions migration...");

    // Add assigned_to column to jobs table
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
