
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://madmadisonai.com",
  "https://www.madmadisonai.com",
  "http://localhost:3000",
].filter(Boolean);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Safe startup diagnostics. Never log secret values.
console.log(
  "DATABASE_URL available:",
  Boolean(process.env.DATABASE_URL)
);

console.log(
  "JWT_SECRET available:",
  Boolean(process.env.JWT_SECRET)
);

const COOKIE_NAME = "madai_session";
const SESSION_DURATION = "7d";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: SESSION_DURATION }
  );
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getTokenFromRequest(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];

  if (cookieToken) {
    return cookieToken;
  }

  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return null;
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// Basic server status
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "MADAI backend is running",
  });
});

// Database connection health check
app.get(
  "/api/health",
  asyncRoute(async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        status: "error",
        database: "not configured",
      });
    }

    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  })
);

// Sign up
app.post(
  "/api/auth/signup",
  asyncRoute(async (req, res) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim()
        : "";

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: "Enter a valid email address",
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        error: "Password must be between 8 and 128 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        ...(name ? { name } : {}),
      },
    });

    const token = createToken(user);
    setSessionCookie(res, token);

    return res.status(201).json({
      success: true,
      user: publicUser(user),
    });
  })
);

// Log in
app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = createToken(user);
    setSessionCookie(res, token);

    return res.status(200).json({
      success: true,
      user: publicUser(user),
    });
  })
);

// Current signed-in user
app.get(
  "/api/auth/me",
  asyncRoute(async (req, res) => {
    const token = getTokenFromRequest(req);

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({
        error: "Invalid session",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid session",
      });
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        error: "Session expired",
      });
    }

    return res.status(200).json({
      user: publicUser(user),
    });
  })
);

// Log out
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Request failed:", err.message);

  if (err.message === "Origin not allowed") {
    return res.status(403).json({
      error: "Origin not allowed",
    });
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    error: "Internal server error",
  });
});

module.exports = app;
module.exports.prisma = prisma;
