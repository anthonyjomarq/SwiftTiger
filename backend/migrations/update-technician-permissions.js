const { pool } = require("../database");

const updateTechnicianPermissions = async () => {
  try {
    console.log("Updating technician permissions...");

    // Add jobs.edit permission to technicians
    await pool.query(`
      INSERT INTO role_permissions (role, permission_id)
      SELECT 'technician', id FROM permissions WHERE name = 'jobs.edit'
      ON CONFLICT DO NOTHING;
    `);

    console.log("Technician permissions updated successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  updateTechnicianPermissions()
    .then(() => {
      console.log("Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { updateTechnicianPermissions };
