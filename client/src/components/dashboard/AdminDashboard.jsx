import React from "react";
import {
  Users,
  Briefcase,
  MapPin,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const AdminDashboard = () => {
  // Mock data for demonstration
  const stats = [
    {
      name: "Total Users",
      value: "24",
      change: "+12%",
      changeType: "increase",
      icon: Users,
      color: "blue",
    },
    {
      name: "Active Jobs",
      value: "47",
      change: "+8%",
      changeType: "increase",
      icon: Briefcase,
      color: "green",
    },
    {
      name: "Completed Today",
      value: "12",
      change: "+15%",
      changeType: "increase",
      icon: CheckCircle,
      color: "purple",
    },
    {
      name: "Pending Jobs",
      value: "8",
      change: "-3%",
      changeType: "decrease",
      icon: Clock,
      color: "orange",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "New user registered",
      user: "John Doe",
      time: "5 minutes ago",
      type: "user",
    },
    {
      id: 2,
      action: "Job completed",
      user: "Jane Smith",
      time: "15 minutes ago",
      type: "job",
    },
    {
      id: 3,
      action: "Route optimized",
      user: "System",
      time: "1 hour ago",
      type: "route",
    },
    {
      id: 4,
      action: "Customer added",
      user: "Mike Johnson",
      time: "2 hours ago",
      type: "customer",
    },
  ];

  const systemHealth = [
    { name: "API Response Time", value: "245ms", status: "good" },
    { name: "Database Connections", value: "12/50", status: "good" },
    { name: "Active Sessions", value: "18", status: "good" },
    { name: "Error Rate", value: "0.02%", status: "warning" },
  ];

  const getStatIconClass = (color) => {
    const colors = {
      blue: "stat-icon-blue",
      green: "stat-icon-green",
      purple: "stat-icon-purple",
      orange: "stat-icon-orange",
    };
    return colors[color] || colors.blue;
  };

  const getStatusClass = (status) => {
    const colors = {
      good: "status-good",
      warning: "status-warning",
      error: "status-error",
    };
    return colors[status] || colors.good;
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h2 className="dashboard-title">Admin Dashboard</h2>
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
            <button className="btn btn-outline btn-md quick-action-btn">
              <Users className="icon-sm mr-2" />
              Manage Users
            </button>
            <button className="btn btn-outline btn-md quick-action-btn">
              <Briefcase className="icon-sm mr-2" />
              Create Job
            </button>
            <button className="btn btn-outline btn-md quick-action-btn">
              <Calendar className="icon-sm mr-2" />
              Schedule Route
            </button>
            <button className="btn btn-outline btn-md quick-action-btn">
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
