const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getAnalytics(userId) {
  const [userCount, conversationCount, messageCount, memoryCount, revenueCount, revenueTotal] = await Promise.all([
    prisma.user.count(),
    prisma.conversation.count(userId ? { where: { userId } } : undefined),
    prisma.message.count(userId ? { where: { user: { id: userId } } } : undefined),
    prisma.memory.count(userId ? { where: { userId } } : undefined),
    prisma.revenueReport.count(userId ? { where: { userId } } : undefined),
    prisma.revenueReport.aggregate({
      _sum: { amount: true },
      where: userId ? { userId } : undefined,
    }),
  ]);

  return {
    users: userCount,
    conversations: conversationCount,
    messages: messageCount,
    memoryCount,
    revenueStats: {
      totalReports: revenueCount,
      totalRevenue: Number(revenueTotal._sum.amount || 0),
      averageRevenue: revenueCount ? Number(revenueTotal._sum.amount || 0) / revenueCount : 0,
    },
  };
}

module.exports = {
  getAnalytics,
};
