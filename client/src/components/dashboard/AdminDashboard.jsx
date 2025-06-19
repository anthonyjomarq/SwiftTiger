import React from "react";
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

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Mock data - This would come from API
  const stats = [
    {
      name: "Total Users",
      value: "48",
      change: "+12%",
      changeType: "increase",
      icon: Users,
      color: "blue",
    },
    {
      name: "Active Jobs",
      value: "124",
      change: "+23%",
      changeType: "increase",
      icon: Briefcase,
      color: "green",
    },
    {
      name: "Routes Today",
      value: "18",
      change: "-5%",
      changeType: "decrease",
      icon: MapPin,
      color: "purple",
    },
    {
      name: "System Uptime",
      value: "99.9%",
      change: "0%",
      changeType: "neutral",
      icon: Activity,
      color: "orange",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "user",
      action: "New user registered",
      user: "John Doe",
      time: "5 minutes ago",
    },
    {
      id: 2,
      type: "job",
      action: "Job #1234 completed",
      user: "Jane Smith",
      time: "15 minutes ago",
    },
    {
      id: 3,
      type: "route",
      action: "Route optimized",
      user: "System",
      time: "1 hour ago",
    },
    {
      id: 4,
      type: "customer",
      action: "New customer added",
      user: "Bob Wilson",
      time: "2 hours ago",
    },
  ];

  const systemHealth = [
    { name: "API Response Time", value: "125ms", status: "healthy" },
    { name: "Database Connection", value: "Active", status: "healthy" },
    { name: "Error Rate", value: "0.02%", status: "healthy" },
    { name: "Active Sessions", value: "234", status: "warning" },
  ];

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
          <button className="btn btn-primary btn-md">
            <TrendingUp className="icon-sm mr-2" />
            View Analytics
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
                          : "stat-change-negative"
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
              <TrendingUp className="icon-sm mr-2" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
