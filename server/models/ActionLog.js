// models/ActionLog.js
import { DataTypes } from "sequelize";

// Try multiple import patterns to handle different export styles
let sequelize;
try {
  // Try named export first
  const db = await import("../config/database.js");
  sequelize = db.sequelize || db.default;
} catch (error) {
  // Fallback to default export
  const db = await import("../config/database.js");
  sequelize = db.default;
}

const ActionLog = sequelize.define(
  "ActionLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id", // Explicitly map to snake_case column
      references: {
        model: "users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "resource_id", // Explicitly map to snake_case column
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: "ip_address", // Explicitly map to snake_case column
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_agent", // Explicitly map to snake_case column
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "action_logs",
    underscored: true, // This ensures Sequelize uses snake_case
    indexes: [
      {
        name: "action_logs_user_id_timestamp",
        fields: ["user_id", "timestamp"], // Use the actual database column names
      },
      {
        name: "action_logs_action",
        fields: ["action"],
      },
      {
        name: "action_logs_resource",
        fields: ["resource", "resource_id"],
      },
      {
        name: "action_logs_timestamp",
        fields: ["timestamp"],
      },
    ],
  }
);

export default ActionLog;
