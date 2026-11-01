const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users.map(sanitizeUser);
}

module.exports = {
  sanitizeUser,
  getUserById,
  hashPassword,
  comparePassword,
  listUsers,
};
