import User from "./User.js";
import ActionLog from "./ActionLog.js";

// Define associations
User.hasMany(ActionLog, {
  foreignKey: "user_id", // Use database column name
  as: "actionLogs",
});

ActionLog.belongsTo(User, {
  foreignKey: "user_id", // Use database column name
  as: "user",
});

export { User, ActionLog };
