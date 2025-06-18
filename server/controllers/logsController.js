import { getActionLogs } from "../services/actionLogger.js";
import { logAction } from "../services/actionLogger.js";

export const getLogs = async (req, res) => {
  try {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (page - 1) * limit;

    const { logs, count } = await getActionLogs({
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    await logAction(req, "VIEW_LOGS", "LOGS", null, {
      filters: { userId, action, resource, startDate, endDate },
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
};
