const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getAnalytics(userId) {
  const [userCount, conversationCount, memoryCount, revenueCount, revenueTotal] = await Promise.all([
    prisma.user.count(),
    prisma.conversation.count({
      where: userId ? { userId } : undefined,
    }),
    prisma.memory.count({
      where: userId ? { userId } : undefined,
    }),
    prisma.revenueReport.count({
      where: userId ? { userId } : undefined,
    }),
    prisma.revenueReport.aggregate({
      _sum: { amount: true },
      where: userId ? { userId } : undefined,
    }),
  ]);

  return {
    userCounts: {
      total: userCount,
    },
    conversationCounts: {
      total: conversationCount,
    },
    memoryCounts: {
      total: memoryCount,
    },
    revenueStatistics: {
      totalReports: revenueCount,
      totalRevenue: Number(revenueTotal._sum.amount || 0),
      averageRevenue: revenueCount ? Number(revenueTotal._sum.amount || 0) / revenueCount : 0,
    },
  };
}

module.exports = {
  getAnalytics,
};
