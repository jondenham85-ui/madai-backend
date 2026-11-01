const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");

const { globalLimiter } = require("./middleware/rateLimit");
const errorHandler = require("./middleware/errorHandler");
const requireAuth = require("./middleware/auth");
const { authorizeRoles } = require("./middleware/roles");

const authRoutes = require("./routes/auth");
const synthRoutes = require("./routes/synth");
const memoryRoutes = require("./routes/memory");
const revenueRoutes = require("./routes/revenue");
const analyticsRoutes = require("./routes/analytics");
const shopmadRoutes = require("./routes/shopmad");
const adminRoutes = require("./routes/admin");

const prisma = new PrismaClient();
const app = express();

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
app.use(globalLimiter);

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

app.use("/api/auth", authRoutes);
app.use("/api/synth", requireAuth, synthRoutes);
app.use("/api/memory", requireAuth, memoryRoutes);
app.use("/api/revenue", requireAuth, revenueRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/shopmad", requireAuth, shopmadRoutes);
app.use(
  "/api/admin",
  requireAuth,
  authorizeRoles("OWNER", "CO_OWNER", "FAMILY_ADMIN", "ADMIN"),
  adminRoutes
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

app.use(errorHandler);

module.exports = app;
