// client/src/components/common/Sidebar.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();

  const getNavigationItems = () => {
    if (!user) return [];

    const items = [];

    // Admin items
    if (user.role === "admin") {
      items.push(
        { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
        { name: "User Management", path: "/users", icon: "👥" },
        { name: "Activity Logs", path: "/logs", icon: "📋" },
        { name: "System Settings", path: "/settings", icon: "⚙️" }
      );
    }

    // Dispatcher items
    if (user.role === "dispatcher" || user.role === "admin") {
      items.push(
        { name: "Job Management", path: "/jobs", icon: "📋" },
        { name: "Route Planning", path: "/routes", icon: "🗺️" },
        { name: "Customers", path: "/customers", icon: "🏢" }
      );
    }

    // Technician items
    if (
      user.role === "technician" ||
      user.role === "dispatcher" ||
      user.role === "admin"
    ) {
      items.push(
        { name: "My Jobs", path: "/technician/dashboard", icon: "🔧" },
        { name: "Profile", path: "/profile", icon: "👤" }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#2c3e50",
        color: "white",
        height: "100vh",
        padding: "1rem",
        position: "fixed",
        left: 0,
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
          textAlign: "center",
          borderBottom: "1px solid #34495e",
          paddingBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0, color: "#3498db" }}>SwiftTiger</h2>
        <p
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "0.8rem",
            color: "#bdc3c7",
          }}
        >
          Field Service Management
        </p>
      </div>

      {/* User Info */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#34495e",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ margin: "0 0 0.5rem 0", color: "#3498db" }}>
          {user?.firstName} {user?.lastName}
        </h4>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#bdc3c7" }}>
          {user?.email}
        </p>
        <span
          style={{
            display: "inline-block",
            marginTop: "0.5rem",
            padding: "0.25rem 0.5rem",
            backgroundColor: "#3498db",
            borderRadius: "12px",
            fontSize: "0.7rem",
            textTransform: "capitalize",
          }}
        >
          {user?.role}
        </span>
      </div>

      {/* Navigation */}
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navigationItems.map((item, index) => (
            <li key={index} style={{ marginBottom: "0.5rem" }}>
              <a
                href={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.75rem",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                  backgroundColor: "transparent",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                <span style={{ marginRight: "0.75rem", fontSize: "1.2rem" }}>
                  {item.icon}
                </span>
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div
        style={{
          position: "absolute",
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
        }}
      >
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
