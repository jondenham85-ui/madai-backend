const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { globalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Allowed website origins
const allowedOrigins = [
  "https://madmadisonai.com",
  "https://www.madmadisonai.com",
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL || "").split(","),
  ...(process.env.FRONTEND_URLS || "").split(","),
]
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// Allow only known website origins and MADAI Vercel deployments
function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);

    if (url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname;

    return (
      /^madai-[a-z0-9-]+-jondenham85-uis-projects\.vercel\.app$/i.test(host) ||
      /^madison-frontend-[a-z0-9-]+-jondenham85-uis-projects\.vercel\.app$/i.test(host)
    );
  } catch {
    return false;
  }
}

app.use(helmet());

// Cross-origin access
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.error("CORS origin rejected:", origin);

      const error = new Error("Origin not allowed");
      error.status = 403;

      return callback(error);
    },
    credentials: true,
  })
);

// Request processing and rate limiting
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  morgan(
    process.env.NODE_ENV === "production" ? "combined" : "dev"
  )
);

app.use(globalLimiter);

// Root health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "MADAI API",
  });
});

// Detailed health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "MADAI API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Authentication
app.use("/api/auth", require("./routes/auth"));

// AI chat
app.use("/api/ai", require("./routes/ai"));

// Return JSON for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
