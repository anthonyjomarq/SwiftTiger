/**
 * Database Reset Script
 * Completely resets the database by dropping all tables and recreating them
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */

const { pool } = require("./database");
const { log } = require("./utils/logger");

/**
 * Reset database by dropping all tables and recreating them
 */
async function resetDatabase() {
  const client = await pool.connect();

  try {
    console.log("🗑️  Starting database reset...");

    await client.query("BEGIN");

    // Drop all tables in the correct order (respecting foreign key constraints)
    console.log("📋 Dropping existing tables...");

    const dropQueries = [
      "DROP TABLE IF EXISTS role_permissions CASCADE;",
      "DROP TABLE IF EXISTS permissions CASCADE;",
      "DROP TABLE IF EXISTS shared_routes CASCADE;",
      "DROP TABLE IF EXISTS technician_locations CASCADE;",
      "DROP TABLE IF EXISTS job_updates CASCADE;",
      "DROP TABLE IF EXISTS jobs CASCADE;",
      "DROP TABLE IF EXISTS customers CASCADE;",
      "DROP TABLE IF EXISTS users CASCADE;",
    ];

    for (const query of dropQueries) {
      await client.query(query);
      console.log(`✅ Dropped table: ${query.split(" ")[2]}`);
    }

    await client.query("COMMIT");
    console.log("✅ All tables dropped successfully!");

    // Now reinitialize the database
    console.log("🔧 Reinitializing database...");
    const { initializeDatabase } = require("./database");
    await initializeDatabase();

    console.log("🎉 Database reset completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the backend server: node server.js");
    console.log("   2. Start the frontend server: npm run dev");
    console.log("   3. Go to http://localhost:3000/register");
    console.log("   4. Register as the first user (you'll become admin)");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Database reset failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log("✅ Database reset completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database reset failed:", error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
