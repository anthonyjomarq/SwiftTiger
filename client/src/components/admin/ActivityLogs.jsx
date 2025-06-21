import React, { useState, useEffect } from "react";
import { logsService } from "../../services/logsService";
import { formatDate, getRelativeTime } from "../../utils/dateUtils";
import { Download, Filter, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
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

      console.log("Logs API Response:", response); // Debug log

      setLogs(response.logs || []);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        }
      );
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await logsService.exportLogs(filters);
    } catch (error) {
      console.error("Failed to export logs:", error);
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
      JOB_CREATED: "📝",
      JOB_UPDATED: "🔄",
      JOB_COMPLETED: "✓",
      ROUTE_CREATED: "🗺️",
      ROUTE_OPTIMIZED: "⚡",
    };
    return icons[action] || "📝";
  };

  const getActionColor = (action) => {
    if (action.includes("FAILED") || action.includes("ERROR")) return "danger";
    if (action.includes("DELETE") || action.includes("DEACTIVATE"))
      return "warning";
    if (
      action.includes("CREATE") ||
      action.includes("ACTIVATE") ||
      action.includes("REGISTER")
    )
      return "success";
    if (action.includes("VIEW") || action.includes("LOGIN")) return "info";
    return "info";
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      resource: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="activity-logs">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1>Activity Logs</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={fetchLogs}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="log-filters">
        <input
          type="text"
          name="action"
          placeholder="Filter by action..."
          value={filters.action}
          onChange={handleFilterChange}
        />
        <select
          name="resource"
          value={filters.resource}
          onChange={handleFilterChange}
        >
          <option value="">All Resources</option>
          <option value="USER">User</option>
          <option value="JOB">Job</option>
          <option value="ROUTE">Route</option>
          <option value="CUSTOMER">Customer</option>
          <option value="AUTH">Authentication</option>
          <option value="SYSTEM">System</option>
        </select>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <button onClick={handleApplyFilters}>
          <Filter size={16} style={{ marginRight: "0.5rem" }} />
          Apply Filters
        </button>
        {(filters.action ||
          filters.resource ||
          filters.startDate ||
          filters.endDate) && (
          <button
            onClick={handleClearFilters}
            style={{ backgroundColor: "#6b7280" }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <h3>No logs found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Resource</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="log-row">
                  <td>
                    <div
                      className={`action-badge action-${getActionColor(
                        log.action
                      )}`}
                    >
                      <span className="log-icon">
                        {getActionIcon(log.action)}
                      </span>
                      <span>{log.action.replace(/_/g, " ")}</span>
                    </div>
                  </td>
                  <td>
                    {log.User ? (
                      <span className="user-link">
                        {log.User.firstName} {log.User.lastName}
                      </span>
                    ) : log.userId ? (
                      <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                        User ID: {log.userId.substring(0, 8)}...
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>System</span>
                    )}
                  </td>
                  <td>
                    <span className="resource-badge">
                      {log.resource}
                      {log.resourceId && ` #${log.resourceId}`}
                    </span>
                  </td>
                  <td>
                    <div className="log-details">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <span title={JSON.stringify(log.details, null, 2)}>
                          {Object.entries(log.details)
                            .filter(
                              ([key]) =>
                                !["method", "path", "timestamp"].includes(key)
                            )
                            .map(
                              ([key, value]) =>
                                `${key}: ${JSON.stringify(value)}`
                            )
                            .join(", ")
                            .substring(0, 50)}
                          {JSON.stringify(log.details).length > 50 && "..."}
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="log-timestamp">
                      {log.ipAddress || "-"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="log-timestamp"
                      title={formatDate(log.timestamp)}
                    >
                      {getRelativeTime(log.timestamp)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} logs
          </div>

          <div className="pagination-controls">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNumber;
                if (pagination.pages <= 5) {
                  pageNumber = i + 1;
                } else if (pagination.page <= 3) {
                  pageNumber = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNumber = pagination.pages - 4 + i;
                } else {
                  pageNumber = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: pageNumber }))
                    }
                    className={pagination.page === pageNumber ? "active" : ""}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              disabled={
                pagination.page === pagination.pages || pagination.pages === 0
              }
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
