import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/className";

const Header = ({ setSidebarOpen }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setProfileDropdownOpen(false);
  };

  // Mock notifications for demonstration
  const notifications = [
    {
      id: 1,
      title: "New job assigned",
      message: "Job #1234 has been assigned to you",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Route updated",
      message: "Your route for today has been optimized",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Job completed",
      message: "Job #1230 marked as completed",
      time: "2 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="header">
      <div className="header-content">
        {/* Left side - Mobile menu button */}
        <div className="header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="icon-md text-secondary-500" />
          </button>

          {/* Search bar */}
          <div className="search-container">
            <div className="search-wrapper">
              <div className="search-icon">
                <Search className="icon-sm text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs, customers..."
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Right side - Notifications and profile */}
        <div className="header-right">
          {/* Notifications */}
          <div className="notification-container" ref={notificationDropdownRef}>
            <button
              className="notification-btn"
              onClick={() =>
                setNotificationDropdownOpen(!notificationDropdownOpen)
              }
            >
              <Bell className="icon-md" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notifications dropdown */}
            {notificationDropdownOpen && (
              <div className="dropdown notification-dropdown">
                <div className="dropdown-header">
                  <h3 className="dropdown-title">Notifications</h3>
                </div>
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "notification-item",
                        notification.unread && "notification-unread"
                      )}
                    >
                      <div className="notification-content">
                        <div className="notification-main">
                          <p className="notification-title">
                            {notification.title}
                          </p>
                          <p className="notification-message">
                            {notification.message}
                          </p>
                        </div>
                        {notification.unread && (
                          <div className="notification-dot"></div>
                        )}
                      </div>
                      <p className="notification-time">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <button className="dropdown-action-btn">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="profile-container" ref={profileDropdownRef}>
            <button
              className="profile-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="profile-avatar">
                <span className="profile-initials">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="profile-info">
                <p className="profile-name">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="profile-role">{user?.role}</p>
              </div>
              <ChevronDown className="icon-sm text-secondary-400" />
            </button>

            {/* Profile dropdown menu */}
            {profileDropdownOpen && (
              <div className="dropdown profile-dropdown">
                <div className="dropdown-menu">
                  <button
                    onClick={handleProfileClick}
                    className="dropdown-item"
                  >
                    <User className="icon-sm mr-3" />
                    Your Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    <Settings className="icon-sm mr-3" />
                    Settings
                  </button>
                  <hr className="dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="dropdown-item dropdown-item-danger"
                  >
                    <LogOut className="icon-sm mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
