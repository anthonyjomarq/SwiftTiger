const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function up() {
  const client = await pool.connect();

  try {
    console.log("Adding performance indexes...");

    // Jobs table indexes
    await client.query(
      "CREATE INDEX CONCURRENTLY idx_jobs_status ON jobs(status)"
    );
    console.log("✓ Created index on jobs.status");

    await client.query(
      "CREATE INDEX CONCURRENTLY idx_jobs_assigned_to ON jobs(assigned_to)"
    );
    console.log("✓ Created index on jobs.assigned_to");

    await client.query(
      "CREATE INDEX CONCURRENTLY idx_jobs_customer_id ON jobs(customer_id)"
    );
    console.log("✓ Created index on jobs.customer_id");

    await client.query(
      "CREATE INDEX CONCURRENTLY idx_jobs_scheduled_date ON jobs(scheduled_date)"
    );
    console.log("✓ Created index on jobs.scheduled_date");

    await client.query(
      "CREATE INDEX CONCURRENTLY idx_jobs_last_activity ON jobs(last_activity DESC)"
    );
    console.log("✓ Created index on jobs.last_activity DESC");

    // Customers table indexes
    await client.query(
      "CREATE INDEX CONCURRENTLY idx_customers_email ON customers(email)"
    );
    console.log("✓ Created index on customers.email");

    // Users table indexes
    await client.query(
      "CREATE INDEX CONCURRENTLY idx_users_email ON users(email)"
    );
    console.log("✓ Created index on users.email");

    await client.query(
      "CREATE INDEX CONCURRENTLY idx_users_role ON users(role)"
    );
    console.log("✓ Created index on users.role");

    console.log("All performance indexes created successfully!");
  } catch (error) {
    console.error("Error creating performance indexes:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();

  try {
    console.log("Removing performance indexes...");

    // Drop indexes in reverse order
    await client.query("DROP INDEX CONCURRENTLY IF EXISTS idx_users_role");
    await client.query("DROP INDEX CONCURRENTLY IF EXISTS idx_users_email");
    await client.query("DROP INDEX CONCURRENTLY IF EXISTS idx_customers_email");
    await client.query(
      "DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_last_activity"
    );
    await client.query(
      "DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_scheduled_date"
    );
    await client.query(
      "DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_customer_id"
    );
    await client.query(
      "DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_assigned_to"
    );
    await client.query("DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_status");

    console.log("All performance indexes removed successfully!");
  } catch (error) {
    console.error("Error removing performance indexes:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };
