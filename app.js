const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Safe diagnostic.
// Never print the actual DATABASE_URL because it contains credentials.
console.log(
  "DATABASE_URL available:",
  Boolean(process.env.DATABASE_URL)
);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "MADAI backend is running",
  });
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    // Make sure Render passed DATABASE_URL to this service.
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not available to the running service.");

      return res.status(503).json({
        status: "error",
        database: "not configured",
        message: "DATABASE_URL environment variable is missing",
      });
    }

    // Test the actual database connection.
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return res.status(503).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

module.exports = {
  app,
  prisma,
};


