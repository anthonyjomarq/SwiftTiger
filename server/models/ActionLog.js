import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
      allowNull: true, // Changed to allow null for system actions
      field: "user_id",
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.STRING(255),
      field: "resource_id",
    },
    details: {
      type: DataTypes.JSONB,
    },
    ipAddress: {
      type: DataTypes.INET,
      field: "ip_address",
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: "user_agent",
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "action_logs",
    underscored: true,
    timestamps: false,
  }
);

export default ActionLog;
