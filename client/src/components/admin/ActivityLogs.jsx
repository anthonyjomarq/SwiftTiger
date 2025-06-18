import React, { useState, useEffect } from "react";
import { logsService } from "../../services/logsService";
import { formatDate } from "../../utils/dateUtils";
import "./ActivityLogs.css";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    resource: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logsService.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      USER_LOGIN: "🔐",
      USER_LOGOUT: "🚪",
      USER_REGISTERED: "👤",
      PASSWORD_CHANGED: "🔑",
      USER_UPDATED: "✏️",
      USER_DEACTIVATED: "❌",
      USER_ACTIVATED: "✅",
      VIEW_USERS: "👥",
      VIEW_LOGS: "📋",
    };
    return icons[action] || "📝";
  };

  const getActionColor = (action) => {
    if (action.includes("FAILED")) return "danger";
    if (action.includes("DELETE") || action.includes("DEACTIVATE"))
      return "warning";
    if (action.includes("CREATE") || action.includes("ACTIVATE"))
      return "success";
    return "info";
  };

  return (
    <div className="activity-logs">
      <h1>Activity Logs</h1>

      <div className="log-filters">
        <input
          type="text"
          placeholder="Filter by action..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by resource..."
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
        <button onClick={fetchLogs}>Apply Filters</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading logs...</div>
      ) : (
        <div className="logs-container">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`log-entry log-${getActionColor(log.action)}`}
            >
              <div className="log-header">
                <span className="log-icon">{getActionIcon(log.action)}</span>
                <span className="log-action">{log.action}</span>
                <span className="log-timestamp">
                  {formatDate(log.timestamp)}
                </span>
              </div>
              <div className="log-details">
                <span className="log-user">
                  {log.User
                    ? `${log.User.firstName} ${log.User.lastName}`
                    : "System"}
                </span>
                <span className="log-resource">{log.resource}</span>
                {log.ipAddress && (
                  <span className="log-ip">IP: {log.ipAddress}</span>
                )}
              </div>
              {log.details && (
                <div className="log-extra-details">
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
          }
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.pages} ({pagination.total} total
          logs)
        </span>
        <button
          disabled={pagination.page === pagination.pages}
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActivityLogs;
