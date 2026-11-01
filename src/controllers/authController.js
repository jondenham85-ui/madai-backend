const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function signup({ name, email, password }) {
  const safeName = String(name || "").trim();
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");

  if (!safeName || !safeEmail || !safePassword) {
    const error = new Error("Name, email, and password are required");
    error.status = 400;
    throw error;
  }

  if (safePassword.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.status = 400;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: safeEmail } });
  if (existingUser) {
    const error = new Error("An account with this email already exists");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(safePassword, 12);
  const user = await prisma.user.create({
    data: {
      name: safeName,
      email: safeEmail,
      passwordHash,
      role: "USER",
    },
  });

  return {
    user: publicUser(user),
    token: generateToken(user),
    cookieOptions: cookieOptions(),
  };
}

async function login({ email, password }) {
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");

  if (!safeEmail || !safePassword) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email: safeEmail } });
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(safePassword, user.passwordHash);
  if (!isValid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  return {
    user: publicUser(user),
    token: generateToken(user),
    cookieOptions: cookieOptions(),
  };
}

async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return publicUser(user);
}

module.exports = {
  signup,
  login,
  me,
  publicUser,
  cookieOptions,
  generateToken,
};
