import ActionLog from "../models/ActionLog.js";

export const logAction = async (
  req,
  action,
  resource,
  resourceId = null,
  details = {}
) => {
  try {
    const logEntry = {
      userId: req.user?.id || "system",
      action,
      resource,
      resourceId,
      details: {
        ...details,
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    };

    await ActionLog.create(logEntry);
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};

export const getActionLogs = async (filters = {}) => {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters;

  const where = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[Op.gte] = startDate;
    if (endDate) where.timestamp[Op.lte] = endDate;
  }

  const logs = await ActionLog.findAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "email", "firstName", "lastName", "role"],
      },
    ],
    order: [["timestamp", "DESC"]],
    limit,
    offset,
  });

  const count = await ActionLog.count({ where });

  return { logs, count };
};
