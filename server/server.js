import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("🚀 Starting SwiftTiger server...");

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("✅ Middleware configured");

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "SwiftTiger API",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

console.log("✅ Health check endpoint added");

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "SwiftTiger API is working!",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ Test endpoint added");

// Import routes
console.log("🚀 Mounting API routes...");

try {
  const authRoutes = await import("./routes/auth.js");
  app.use("/api/auth", authRoutes.default);
  console.log("✅ Auth routes mounted");

  const userRoutes = await import("./routes/users.js");
  app.use("/api/users", userRoutes.default);
  console.log("✅ User routes mounted");
} catch (error) {
  console.error("❌ Error mounting routes:", error);
  process.exit(1);
}

console.log("✅ API routes mounted successfully");

// 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}`,
  });
});

console.log("✅ Error handlers configured");

// Start server - NO DATABASE DEPENDENCY
console.log("🚀 Starting HTTP server...");

try {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
    console.log(`👥 Users: http://localhost:${PORT}/api/users`);
    console.log("🎉 SwiftTiger API is ready!");
  });
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("💥 Unhandled Rejection:", error);
  process.exit(1);
});
