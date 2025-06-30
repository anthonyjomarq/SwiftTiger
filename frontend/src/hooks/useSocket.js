import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useSocket = () => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!user || !token) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection with authentication
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection events
    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // User presence events
    socketRef.current.on("users:online", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("user:presence", (presenceData) => {
      setOnlineUsers((prev) => {
        const existing = prev.find((u) => u.userId === presenceData.userId);
        if (existing) {
          return prev.map((u) =>
            u.userId === presenceData.userId ? { ...u, ...presenceData } : u
          );
        } else {
          return [...prev, presenceData];
        }
      });
    });

    // Notification events
    socketRef.current.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    socketRef.current.on("notification:updated", ({ notificationId, read }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: read ? new Date().toISOString() : null }
            : n
        )
      );
    });

    // Activity feed events
    socketRef.current.on("activity:new", ({ activity, user }) => {
      setActivities((prev) => [
        {
          ...activity,
          user: user,
        },
        ...prev,
      ]);
    });

    // Job update events
    socketRef.current.on("job:updated", (jobUpdate) => {
      // This will be handled by components that need job updates
      // Components can listen to this event via the socket instance
    });

    // Map update events
    socketRef.current.on("map:job-location-updated", (mapUpdate) => {
      // This will be handled by map components
    });

    // Error events
    socketRef.current.on("error", (error) => {
      console.error("Socket error:", error);
      setConnectionError(error.message);
    });
  }, [user, token]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // Emit job update
  const emitJobUpdate = useCallback(
    (jobId, status, notes, location) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("job:update", {
          jobId,
          status,
          notes,
          location,
        });
      }
    },
    [isConnected]
  );

  // Emit presence update
  const emitPresenceUpdate = useCallback(
    (status, location) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("presence:update", { status, location });
      }
    },
    [isConnected]
  );

  // Emit activity
  const emitActivity = useCallback(
    (type, details, relatedId) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("activity:create", { type, details, relatedId });
      }
    },
    [isConnected]
  );

  // Emit map location update
  const emitMapLocationUpdate = useCallback(
    (jobId, location, status) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("map:location-update", {
          jobId,
          location,
          status,
        });
      }
    },
    [isConnected]
  );

  // Mark notification as read
  const markNotificationRead = useCallback(
    (notificationId) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("notification:mark-read", { notificationId });
      }
    },
    [isConnected]
  );

  // Listen to specific events (for components)
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Connect on mount and when user/token changes
  useEffect(() => {
    if (user && token) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, token, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    onlineUsers,
    notifications,
    activities,
    emitJobUpdate,
    emitPresenceUpdate,
    emitActivity,
    emitMapLocationUpdate,
    markNotificationRead,
    on,
    off,
    connect,
    disconnect,
  };
};
