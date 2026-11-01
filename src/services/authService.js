const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getUsers(req, res, next) {
  try {
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

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return next(error);
  }
}

async function getDirectives(req, res, next) {
  try {
    const directives = await prisma.directive.findMany({
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

    return res.status(200).json({ success: true, directives });
  } catch (error) {
    return next(error);
  }
}

async function getSystemSummary(req, res, next) {
  try {
    const [userCount, conversationCount, memoryCount, directiveCount] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.memory.count(),
      prisma.directive.count(),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        users: userCount,
        conversations: conversationCount,
        memories: memoryCount,
        directives: directiveCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getDirectives,
  getSystemSummary,
};
