const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const errorHandler = require("./middlewares/error.middleware");
const cron = require("node-cron");

const app = express();


cron.schedule("*/14 * * * *", () => {
  app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Fake News Detector API is running." });
});
});

// Core middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
// Higher limit because base64-encoded images/voice clips are sent directly in the JSON body
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Fake News Detector API is running." });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chats", chatRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;
