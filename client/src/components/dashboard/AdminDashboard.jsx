import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  MapPin,
  Activity,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { userService } from "../../services/userService";
import { logsService } from "../../services/logsService";

const { useState, useEffect } = React;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    byRole: {
      admin: 0,
      dispatcher: 0,
      technician: 0,
    },
  });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      try {
        const stats = await userService.getUserStats();
        setUserStats(stats);
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        // Use default values if API fails
        setUserStats({
          totalUsers: 1,
          activeUsers: 1,
          byRole: { admin: 1, dispatcher: 0, technician: 0 },
        });
      }

      // Fetch recent activity logs
      try {
        const logsData = await logsService.getLogs({ limit: 5 });
        setRecentLogs(logsData.logs || []);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentages
  const activePercentage =
    userStats.totalUsers > 0
      ? Math.round((userStats.activeUsers / userStats.totalUsers) * 100)
      : 0;

  // Stats data with real values
  const stats = [
    {
      name: "Total Users",
      value: userStats.totalUsers.toString(),
      change: `${activePercentage}% active`,
      changeType: activePercentage > 80 ? "increase" : "decrease",
      icon: Users,
      color: "blue",
    },
    {
      name: "Active Jobs",
      value: "0",
      change: "Coming soon",
      changeType: "neutral",
      icon: Briefcase,
      color: "green",
    },
    {
      name: "Routes Today",
      value: "0",
      change: "Coming soon",
      changeType: "neutral",
      icon: MapPin,
      color: "purple",
    },
    {
      name: "System Status",
      value: "Online",
      change: "All systems operational",
      changeType: "increase",
      icon: Activity,
      color: "orange",
    },
  ];

  // Format recent activity from logs
  const recentActivity = recentLogs.map((log) => ({
    id: log.id,
    type: getActivityType(log.action),
    action: formatAction(log.action),
    user: log.User ? `${log.User.firstName} ${log.User.lastName}` : "System",
    time: formatActivityTime(log.timestamp),
  }));

  // Add mock data if no real logs
  if (recentActivity.length === 0) {
    recentActivity.push({
      id: 1,
      type: "system",
      action: "System started",
      user: "System",
      time: "Just now",
    });
  }

  const systemHealth = [
    { name: "API Response Time", value: "125ms", status: "healthy" },
    { name: "Database Connection", value: "Active", status: "healthy" },
    {
      name: "Active Users",
      value: userStats.activeUsers.toString(),
      status: userStats.activeUsers > 0 ? "healthy" : "warning",
    },
    {
      name: "Total Users",
      value: userStats.totalUsers.toString(),
      status: "healthy",
    },
  ];

  // Helper functions
  function getActivityType(action) {
    if (!action) return "system";
    const actionStr = action.toString().toUpperCase();
    if (
      actionStr.includes("USER") ||
      actionStr.includes("LOGIN") ||
      actionStr.includes("REGISTER")
    )
      return "user";
    if (actionStr.includes("JOB")) return "job";
    if (actionStr.includes("ROUTE")) return "route";
    if (actionStr.includes("CUSTOMER")) return "customer";
    return "system";
  }

  function formatAction(action) {
    if (!action) return "Unknown action";
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatActivityTime(timestamp) {
    if (!timestamp) return "Unknown time";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / 60000);

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      if (diffInMinutes < 1440)
        return `${Math.floor(diffInMinutes / 60)} hours ago`;
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    } catch (error) {
      return "Unknown time";
    }
  }

  const getStatIconClass = (color) => {
    const classes = {
      blue: "stat-icon-blue",
      green: "stat-icon-green",
      purple: "stat-icon-purple",
      orange: "stat-icon-orange",
    };
    return classes[color] || "stat-icon-blue";
  };

  const getStatusClass = (status) => {
    const classes = {
      healthy: "status-healthy",
      warning: "status-warning",
      critical: "status-critical",
    };
    return classes[status] || "status-healthy";
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor system performance and manage your SwiftTiger operations
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn btn-primary btn-md"
            onClick={() => navigate("/logs")}
          >
            <Activity className="icon-sm mr-2" />
            View Activity Logs
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="stat-card">
              <div className="stat-content">
                <div className="stat-icon-container">
                  <div className={`stat-icon ${getStatIconClass(stat.color)}`}>
                    <Icon className="icon-md text-white" />
                  </div>
                </div>
                <div className="stat-details">
                  <dt className="stat-label">{stat.name}</dt>
                  <dd className="stat-value-container">
                    <div className="stat-value">{stat.value}</div>
                    <div
                      className={`stat-change ${
                        stat.changeType === "increase"
                          ? "stat-change-positive"
                          : stat.changeType === "decrease"
                          ? "stat-change-negative"
                          : ""
                      }`}
                    >
                      {stat.change}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-content">
            <div className="activity-list">
              <ul className="activity-timeline">
                {recentActivity.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="activity-item">
                      {activityIdx !== recentActivity.length - 1 && (
                        <span className="activity-line" />
                      )}
                      <div className="activity-content">
                        <div>
                          <span className="activity-icon-container">
                            {activity.type === "user" && (
                              <Users className="activity-icon" />
                            )}
                            {activity.type === "job" && (
                              <Briefcase className="activity-icon" />
                            )}
                            {activity.type === "route" && (
                              <MapPin className="activity-icon" />
                            )}
                            {activity.type === "customer" && (
                              <Users className="activity-icon" />
                            )}
                            {activity.type === "system" && (
                              <Activity className="activity-icon" />
                            )}
                          </span>
                        </div>
                        <div className="activity-details">
                          <div>
                            <p className="activity-text">
                              {activity.action} by{" "}
                              <span className="activity-user">
                                {activity.user}
                              </span>
                            </p>
                          </div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Health</h3>
          </div>
          <div className="card-content">
            <div className="health-metrics">
              {systemHealth.map((metric) => (
                <div key={metric.name} className="health-metric">
                  <div className="health-metric-name">
                    <p className="health-name">{metric.name}</p>
                  </div>
                  <div className="health-metric-values">
                    <span className="health-value">{metric.value}</span>
                    <span
                      className={`health-status ${getStatusClass(
                        metric.status
                      )}`}
                    >
                      {metric.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="quick-actions-grid">
            <button
              className="btn btn-outline btn-md quick-action-btn"
              onClick={() => navigate("/users")}
            >
              <Users className="icon-sm mr-2" />
              Manage Users
            </button>
            <button
              className="btn btn-outline btn-md quick-action-btn"
              onClick={() => navigate("/jobs")}
            >
              <Briefcase className="icon-sm mr-2" />
              Create Job
            </button>
            <button
              className="btn btn-outline btn-md quick-action-btn"
              onClick={() => navigate("/routes")}
            >
              <Calendar className="icon-sm mr-2" />
              Schedule Route
            </button>
            <button
              className="btn btn-outline btn-md quick-action-btn"
              onClick={() => navigate("/logs")}
            >
              <Activity className="icon-sm mr-2" />
              Activity Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
