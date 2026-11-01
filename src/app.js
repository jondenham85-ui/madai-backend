require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { PrismaClient } = require("@prisma/client");
const { signup, login, logout, me } = require("./controllers/authController");
const { handlePrompt } = require("./controllers/synthController");
const requireAuth = require("./middleware/auth");

const app = express();
const prisma = new PrismaClient();

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  "https://www.madmadisonai.com",
  "https://madmadisonai.com",
  "https://madai-mu.vercel.app",
  "http://localhost:3000",
  "https://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    service: "MADSI Backend",
    status: "ok",
    message: "MADSI API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: "ok",
      database: "connected",
      uptime: Number(process.uptime().toFixed(2)),
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      database: "unavailable",
      uptime: Number(process.uptime().toFixed(2)),
    });
  }
});

app.post("/api/auth/signup", signup);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);
app.get("/api/auth/me", requireAuth, me);
app.post("/api/synth", requireAuth, handlePrompt);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number(error.status) || 500;
  const message = error.message || "Internal server error";

  return res.status(status).json({
    success: false,
    error: message,
  });
});

module.exports = app;
module.exports.prisma = prisma;
