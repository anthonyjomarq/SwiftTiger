import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊", permission: null }, // Everyone can see
    {
      name: "Customers",
      href: "/customers",
      icon: "👥",
      permission: "customers.view",
    },
    { name: "Jobs", href: "/jobs", icon: "🔧", permission: null }, // Will be handled in component
    {
      name: "Route Planning",
      href: "/routes",
      icon: "🗺️",
      permission: "jobs.view",
    },
  ];

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    const badges = {
      admin: "bg-red-100 text-red-800",
      dispatcher: "bg-blue-100 text-blue-800",
      technician: "bg-green-100 text-green-800",
    };
    return badges[role] || "bg-gray-100 text-gray-800";
  };

  // Check if user can see jobs (either view all or view assigned)
  const canSeeJobs = () => {
    return hasPermission("jobs.view") || hasPermission("jobs.view_assigned");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                SwiftTiger
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {navigation
                .filter((item) => {
                  if (!item.permission) {
                    // Special handling for Jobs navigation
                    if (item.name === "Jobs") {
                      return canSeeJobs();
                    }
                    return true;
                  }
                  return hasPermission(item.permission);
                })
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
            </nav>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
