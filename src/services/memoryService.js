const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const validCategories = ["PERSONAL", "BUSINESS", "REVENUE", "SHOPMAD", "SYSTEM"];

async function listMemories(userId, category) {
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      ...(category ? { category: String(category).toUpperCase() } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return memories;
}

async function createMemory(userId, payload) {
  const category = String(payload?.category || "").trim().toUpperCase();
  const value = String(payload?.value || "").trim();

  if (!category || !value) {
    const error = new Error("Category and value are required");
    error.status = 400;
    throw error;
  }

  if (!validCategories.includes(category)) {
    const error = new Error("Invalid memory category");
    error.status = 400;
    throw error;
  }

  return prisma.memory.create({
    data: {
      userId,
      category,
      value,
      metadata: payload?.metadata || {},
    },
  });
}

async function deleteMemory(userId, memoryId) {
  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!memory) {
    const error = new Error("Memory not found");
    error.status = 404;
    throw error;
  }

  await prisma.memory.delete({ where: { id: memoryId } });

  return {
    success: true,
    id: memoryId,
  };
}

module.exports = {
  listMemories,
  createMemory,
  deleteMemory,
};
