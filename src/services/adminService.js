const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

async function getDirectives() {
  return prisma.directive.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

async function getSystemSummary() {
  const [userCount, conversationCount, memoryCount, directiveCount] = await Promise.all([
    prisma.user.count(),
    prisma.conversation.count(),
    prisma.memory.count(),
    prisma.directive.count(),
  ]);

  return {
    summary: {
      users: userCount,
      conversations: conversationCount,
      memories: memoryCount,
      directives: directiveCount,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  getUsers,
  getDirectives,
  getSystemSummary,
};
