class SocketService {
  constructor() {
    this.io = null;
    this.handlers = null;
  }

  initialize(io) {
    this.io = io;
    const SocketHandlers = require("../socketHandlers");
    this.handlers = new SocketHandlers(io);
    return this.handlers;
  }

  getHandlers() {
    return this.handlers;
  }

  getIO() {
    return this.io;
  }

  // Helper methods for emitting events
  emitJobUpdate(jobId, jobData, userId) {
    if (this.handlers) {
      this.handlers.broadcastJobUpdate(jobId, jobData, userId);
    }
  }

  broadcastJobUpdate(jobId, jobData, userId) {
    if (this.handlers) {
      this.handlers.broadcastJobUpdate(jobId, jobData, userId);
    }
  }

  sendNotification(userId, title, message, type, data) {
    if (this.handlers) {
      return this.handlers.sendNotification(userId, title, message, type, data);
    }
  }

  logActivity(userId, type, details) {
    if (this.handlers) {
      return this.handlers.logActivity(userId, type, details);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
module.exports = socketService;
