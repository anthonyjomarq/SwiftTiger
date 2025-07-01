/**
 * Migration to standardize all database column names to snake_case
 * This migration renames columns to follow consistent naming conventions
 */

const { pool } = require("../database");

const migrateColumnNames = async () => {
  const client = await pool.connect();

  try {
    console.log("Starting column name standardization migration...");

    await client.query("BEGIN");

    // Users table - already mostly snake_case, but ensure consistency
    console.log("Standardizing users table columns...");
    // Note: PostgreSQL doesn't support IF EXISTS for RENAME COLUMN
    // We'll check if the column exists first
    const userColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'createdAt'
    `);

    if (userColumns.rows.length > 0) {
      await client.query(`
        ALTER TABLE users 
        RENAME COLUMN "createdAt" TO created_at;
      `);
    }

    // Customers table - already snake_case
    console.log("Customers table columns are already standardized");

    // Jobs table - convert to snake_case
    console.log("Standardizing jobs table columns...");

    // Check and rename customerId
    const customerIdColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'customerId'
    `);
    if (customerIdColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "customerId" TO customer_id;`
      );
    }

    // Check and rename assignedTo
    const assignedToColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'assignedTo'
    `);
    if (assignedToColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "assignedTo" TO assigned_to;`
      );
    }

    // Check and rename scheduledDate
    const scheduledDateColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'scheduledDate'
    `);
    if (scheduledDateColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "scheduledDate" TO scheduled_date;`
      );
    }

    // Check and rename scheduledTime
    const scheduledTimeColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'scheduledTime'
    `);
    if (scheduledTimeColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "scheduledTime" TO scheduled_time;`
      );
    }

    // Check and rename estimatedDuration
    const estimatedDurationColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'estimatedDuration'
    `);
    if (estimatedDurationColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "estimatedDuration" TO estimated_duration;`
      );
    }

    // Check and rename routeOrder
    const routeOrderColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'routeOrder'
    `);
    if (routeOrderColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "routeOrder" TO route_order;`
      );
    }

    // Check and rename lastActivity
    const lastActivityColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'lastActivity'
    `);
    if (lastActivityColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "lastActivity" TO last_activity;`
      );
    }

    // Check and rename createdAt
    const createdAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'createdAt'
    `);
    if (createdAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE jobs RENAME COLUMN "createdAt" TO created_at;`
      );
    }

    // Job updates table - convert to snake_case
    console.log("Standardizing job_updates table columns...");

    // Check and rename jobId
    const jobUpdatesJobIdColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'job_updates' AND column_name = 'jobId'
    `);
    if (jobUpdatesJobIdColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE job_updates RENAME COLUMN "jobId" TO job_id;`
      );
    }

    // Check and rename userId
    const jobUpdatesUserIdColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'job_updates' AND column_name = 'userId'
    `);
    if (jobUpdatesUserIdColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE job_updates RENAME COLUMN "userId" TO user_id;`
      );
    }

    // Check and rename updateType
    const jobUpdatesUpdateTypeColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'job_updates' AND column_name = 'updateType'
    `);
    if (jobUpdatesUpdateTypeColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE job_updates RENAME COLUMN "updateType" TO update_type;`
      );
    }

    // Check and rename createdAt
    const jobUpdatesCreatedAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'job_updates' AND column_name = 'createdAt'
    `);
    if (jobUpdatesCreatedAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE job_updates RENAME COLUMN "createdAt" TO created_at;`
      );
    }

    // Technician locations table - convert to snake_case
    console.log("Standardizing technician_locations table columns...");

    // Check and rename userId
    const techLocUserIdColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'technician_locations' AND column_name = 'userId'
    `);
    if (techLocUserIdColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE technician_locations RENAME COLUMN "userId" TO user_id;`
      );
    }

    // Check and rename updatedAt
    const techLocUpdatedAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'technician_locations' AND column_name = 'updatedAt'
    `);
    if (techLocUpdatedAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE technician_locations RENAME COLUMN "updatedAt" TO updated_at;`
      );
    }

    // Shared routes table - convert to snake_case
    console.log("Standardizing shared_routes table columns...");

    // Check and rename routeId
    const sharedRoutesRouteIdColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'shared_routes' AND column_name = 'routeId'
    `);
    if (sharedRoutesRouteIdColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE shared_routes RENAME COLUMN "routeId" TO route_id;`
      );
    }

    // Check and rename shareToken
    const sharedRoutesShareTokenColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'shared_routes' AND column_name = 'shareToken'
    `);
    if (sharedRoutesShareTokenColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE shared_routes RENAME COLUMN "shareToken" TO share_token;`
      );
    }

    // Check and rename createdBy
    const sharedRoutesCreatedByColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'shared_routes' AND column_name = 'createdBy'
    `);
    if (sharedRoutesCreatedByColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE shared_routes RENAME COLUMN "createdBy" TO created_by;`
      );
    }

    // Check and rename expiresAt
    const sharedRoutesExpiresAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'shared_routes' AND column_name = 'expiresAt'
    `);
    if (sharedRoutesExpiresAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE shared_routes RENAME COLUMN "expiresAt" TO expires_at;`
      );
    }

    // Check and rename createdAt
    const sharedRoutesCreatedAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'shared_routes' AND column_name = 'createdAt'
    `);
    if (sharedRoutesCreatedAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE shared_routes RENAME COLUMN "createdAt" TO created_at;`
      );
    }

    // Permissions table - convert to snake_case
    console.log("Standardizing permissions table columns...");

    // Check and rename createdAt
    const permissionsCreatedAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'permissions' AND column_name = 'createdAt'
    `);
    if (permissionsCreatedAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE permissions RENAME COLUMN "createdAt" TO created_at;`
      );
    }

    // Role permissions table - convert to snake_case
    console.log("Standardizing role_permissions table columns...");

    // Check and rename permissionId
    const rolePermissionsPermissionIdColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'role_permissions' AND column_name = 'permissionId'
    `);
    if (rolePermissionsPermissionIdColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE role_permissions RENAME COLUMN "permissionId" TO permission_id;`
      );
    }

    // Check and rename createdAt
    const rolePermissionsCreatedAtColumn = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'role_permissions' AND column_name = 'createdAt'
    `);
    if (rolePermissionsCreatedAtColumn.rows.length > 0) {
      await client.query(
        `ALTER TABLE role_permissions RENAME COLUMN "createdAt" TO created_at;`
      );
    }

    await client.query("COMMIT");
    console.log(
      "Column name standardization migration completed successfully!"
    );
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
  migrateColumnNames()
    .then(() => {
      console.log("Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateColumnNames };
