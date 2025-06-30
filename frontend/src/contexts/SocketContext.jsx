import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [jobUpdates, setJobUpdates] = useState([]);
  const [mapUpdates, setMapUpdates] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Listen for job updates
  useEffect(() => {
    if (!socket.socket) return;

    const handleJobUpdate = (jobUpdate) => {
      setJobUpdates((prev) => [jobUpdate, ...prev.slice(0, 9)]); // Keep last 10 updates

      // Show notification for job updates
      if (jobUpdate.updatedBy !== user?.id) {
        showToast(
          `Job ${jobUpdate.jobId} updated to ${jobUpdate.job.status}`,
          "info"
        );
      }
    };

    const handleMapUpdate = (mapUpdate) => {
      setMapUpdates((prev) => [mapUpdate, ...prev.slice(0, 9)]); // Keep last 10 updates
    };

    const handleNewNotification = (notification) => {
      if (!notification.read_at) {
        setUnreadNotifications((prev) => prev + 1);
        showToast(notification.message, notification.type || "info");
      }
    };

    socket.on("job:updated", handleJobUpdate);
    socket.on("map:job-location-updated", handleMapUpdate);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("job:updated", handleJobUpdate);
      socket.off("map:job-location-updated", handleMapUpdate);
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket.socket, user?.id]);

  // Update unread notifications count
  useEffect(() => {
    const unread = socket.notifications.filter((n) => !n.read_at).length;
    setUnreadNotifications(unread);
  }, [socket.notifications]);

  // Show toast notification
  const showToast = (message, type = "info") => {
    // Create a simple toast notification
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full`;

    // Apply color scheme based on type
    switch (type) {
      case "success":
        toast.className += " bg-[#00809d]";
        break;
      case "error":
        toast.className += " bg-[#ff7601]";
        break;
      case "warning":
        toast.className += " bg-[#f3a26d]";
        break;
      default:
        toast.className += " bg-[#00809d]";
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Clear job updates
  const clearJobUpdates = () => {
    setJobUpdates([]);
  };

  // Clear map updates
  const clearMapUpdates = () => {
    setMapUpdates([]);
  };

  // Mark all notifications as read
  const markAllNotificationsRead = () => {
    socket.notifications
      .filter((n) => !n.read_at)
      .forEach((n) => socket.markNotificationRead(n.id));
    setUnreadNotifications(0);
  };

  const value = {
    // Socket connection state
    isConnected: socket.isConnected,
    connectionError: socket.connectionError,

    // Real-time data
    onlineUsers: socket.onlineUsers,
    notifications: socket.notifications,
    activities: socket.activities,
    jobUpdates,
    mapUpdates,
    unreadNotifications,

    // Socket methods
    emitJobUpdate: socket.emitJobUpdate,
    emitPresenceUpdate: socket.emitPresenceUpdate,
    emitActivity: socket.emitActivity,
    emitMapLocationUpdate: socket.emitMapLocationUpdate,
    markNotificationRead: socket.markNotificationRead,

    // Context methods
    showToast,
    clearJobUpdates,
    clearMapUpdates,
    markAllNotificationsRead,

    // Raw socket for advanced usage
    socket: socket.socket,
    on: socket.on,
    off: socket.off,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
