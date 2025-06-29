const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "swifttiger",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
});

const migrateDatabase = async () => {
  try {
    console.log("Starting database migration...");

    // Check if role column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("Adding role column to users table...");

      // Add role column with default value 'user'
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user'
      `);

      // Make the first user an admin
      const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
      if (parseInt(userCount.rows[0].count) > 0) {
        console.log("Setting first user as admin...");
        await pool.query(`
          UPDATE users 
          SET role = 'admin' 
          WHERE id = (SELECT MIN(id) FROM users)
        `);
      }

      console.log("Migration completed successfully!");
    } else {
      console.log("Role column already exists. Migration not needed.");
    }

    // Close the connection
    await pool.end();
  } catch (error) {
    console.error("Migration error:", error);
    await pool.end();
    process.exit(1);
  }
};

migrateDatabase();
