const jwt = require("jsonwebtoken");
const { pool } = require("./database");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Store connected users and their socket mappings
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
const userPresence = new Map(); // userId -> { online: boolean, lastSeen: Date }

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User ${socket.userId} connected`);

      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleJobUpdates(socket);
      this.handleNotifications(socket);
      this.handlePresence(socket);
      this.handleActivityFeed(socket);
      this.handleMapUpdates(socket);
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;

    // Store user connection
    connectedUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);
    userPresence.set(userId, { online: true, lastSeen: new Date() });

    // Join user to their role-based room
    socket.join(`role:${socket.userRole}`);
    socket.join(`user:${userId}`);

    // Emit user online status to all connected users
    this.io.emit("user:presence", {
      userId,
      online: true,
      lastSeen: new Date(),
    });

    // Send current online users to the new user
    const onlineUsers = Array.from(userPresence.entries())
      .filter(([_, presence]) => presence.online)
      .map(([userId, presence]) => ({ userId, ...presence }));

    socket.emit("users:online", onlineUsers);
  }

  handleDisconnection(socket) {
    const userId = socket.userId;

    // Update presence
    userPresence.set(userId, { online: false, lastSeen: new Date() });
    connectedUsers.delete(userId);
    userSockets.delete(socket.id);

    // Emit user offline status
    this.io.emit("user:presence", {
      userId,
      online: false,
      lastSeen: new Date(),
    });

    console.log(`User ${userId} disconnected`);
  }

  handleJobUpdates(socket) {
    socket.on("job:update", async (data) => {
      try {
        const { jobId, status, notes, location } = data;

        // Update job in database
        const result = await pool.query(
          `UPDATE jobs 
           SET status = $1, notes = $2, updated_at = NOW()
           WHERE id = $3 
           RETURNING *`,
          [status, notes, jobId]
        );

        if (result.rows.length > 0) {
          const updatedJob = result.rows[0];

          // Emit to all connected users
          this.io.emit("job:updated", {
            jobId,
            job: updatedJob,
            updatedBy: socket.userId,
            timestamp: new Date(),
          });

          // Log activity
          await this.logActivity(socket.userId, "job_update", {
            jobId,
            status,
            action: `Updated job status to ${status}`,
          });
        }
      } catch (error) {
        console.error("Job update error:", error);
        socket.emit("error", { message: "Failed to update job" });
      }
    });
  }

  handleNotifications(socket) {
    socket.on("notification:mark-read", async (data) => {
      try {
        const { notificationId } = data;

        await pool.query(
          "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2",
          [notificationId, socket.userId]
        );

        socket.emit("notification:updated", { notificationId, read: true });
      } catch (error) {
        console.error("Notification update error:", error);
      }
    });
  }

  handlePresence(socket) {
    socket.on("presence:update", (data) => {
      const { status, location } = data;
      const userId = socket.userId;

      userPresence.set(userId, {
        online: true,
        lastSeen: new Date(),
        status,
        location,
      });

      this.io.emit("user:presence", {
        userId,
        online: true,
        lastSeen: new Date(),
        status,
        location,
      });
    });
  }

  handleActivityFeed(socket) {
    socket.on("activity:create", async (data) => {
      try {
        const { type, details, relatedId } = data;

        const result = await pool.query(
          `INSERT INTO activity_log (user_id, type, details, related_id, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING *`,
          [socket.userId, type, JSON.stringify(details), relatedId]
        );

        const activity = result.rows[0];

        // Emit to all users
        this.io.emit("activity:new", {
          activity,
          user: {
            id: socket.userId,
            email: socket.userEmail,
            role: socket.userRole,
          },
        });
      } catch (error) {
        console.error("Activity creation error:", error);
      }
    });
  }

  handleMapUpdates(socket) {
    socket.on("map:location-update", (data) => {
      const { jobId, location, status } = data;

      // Emit to all users for real-time map updates
      this.io.emit("map:job-location-updated", {
        jobId,
        location,
        status,
        updatedBy: socket.userId,
        timestamp: new Date(),
      });
    });
  }

  // Utility methods for external use
  async logActivity(userId, type, details) {
    try {
      await pool.query(
        `INSERT INTO activity_log (user_id, type, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, type, JSON.stringify(details)]
      );
    } catch (error) {
      console.error("Activity logging error:", error);
    }
  }

  async logActivityWithTransaction(client, userId, type, details) {
    try {
      const result = await client.query(
        `INSERT INTO activity_log (user_id, type, details, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [userId, type, JSON.stringify(details)]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Activity logging with transaction error:", error);
      throw error;
    }
  }

  async sendNotification(userId, title, message, type = "info", data = {}) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [userId, title, message, type, JSON.stringify(data)]
      );

      const notification = result.rows[0];

      // Send to specific user if online
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit("notification:new", notification);
      }

      return notification;
    } catch (error) {
      console.error("Notification sending error:", error);
    }
  }

  async sendNotificationWithTransaction(
    client,
    userId,
    title,
    message,
    type = "info",
    data = {}
  ) {
    try {
      const result = await client.query(
        `INSERT INTO notifications (user_id, title, message, type, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [userId, title, message, type, JSON.stringify(data)]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Notification sending with transaction error:", error);
      throw error;
    }
  }

  broadcastJobUpdate(jobId, jobData, updatedBy) {
    this.io.emit("job:updated", {
      jobId,
      job: jobData,
      updatedBy,
      timestamp: new Date(),
    });
  }

  broadcastActivity(activity, user) {
    this.io.emit("activity:new", { activity, user });
  }

  getOnlineUsers() {
    return Array.from(userPresence.entries())
      .filter(([_, presence]) => presence.online)
      .map(([userId, presence]) => ({ userId, ...presence }));
  }
}

module.exports = SocketHandlers;
