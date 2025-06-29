const { pool } = require("../database");

// Cache permissions for performance
let permissionsCache = new Map();

const loadPermissions = async () => {
  const result = await pool.query(`
    SELECT r.role, p.name as permission
    FROM role_permissions r
    JOIN permissions p ON r.permission_id = p.id
  `);

  const permissions = {};
  result.rows.forEach((row) => {
    if (!permissions[row.role]) {
      permissions[row.role] = new Set();
    }
    permissions[row.role].add(row.permission);
  });

  permissionsCache = new Map(Object.entries(permissions));
};

// Load permissions on startup
loadPermissions();

const hasPermission = (userRole, requiredPermission) => {
  const rolePermissions = permissionsCache.get(userRole);
  if (!rolePermissions) return false;

  // Admin has all permissions
  if (userRole === "admin") return true;

  return rolePermissions.has(requiredPermission);
};

const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get user's current role from database
      const result = await pool.query("SELECT role FROM users WHERE id = $1", [
        user.id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = result.rows[0].role;

      if (!hasPermission(userRole, permission)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization error" });
    }
  };
};

module.exports = { requirePermission, hasPermission, loadPermissions };
