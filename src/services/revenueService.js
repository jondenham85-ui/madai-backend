const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function numberValue(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

async function listRevenue(userId) {
  const reports = await prisma.revenueReport.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const totals = reports.reduce(
    (acc, report) => {
      acc.amount += numberValue(report.amount);
      acc.count += 1;
      return acc;
    },
    { amount: 0, count: 0 }
  );

  const daily = new Map();
  const monthly = new Map();
  const yearly = new Map();

  for (const report of reports) {
    const date = new Date(report.date);
    const dayKey = date.toISOString().slice(0, 10);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const yearKey = String(date.getFullYear());

    daily.set(dayKey, (daily.get(dayKey) || 0) + numberValue(report.amount));
    monthly.set(monthKey, (monthly.get(monthKey) || 0) + numberValue(report.amount));
    yearly.set(yearKey, (yearly.get(yearKey) || 0) + numberValue(report.amount));
  }

  const previousRevenue = reports.length ? Math.max(0, totals.amount - numberValue(reports[reports.length - 1].amount)) : 0;
  const growth = totals.amount === 0 ? 0 : ((totals.amount - previousRevenue) / Math.max(totals.amount, 1)) * 100;

  return {
    daily: Array.from(daily.entries()).map(([date, amount]) => ({ date, amount })),
    weekly: [{ week: "current", amount: totals.amount }],
    monthly: Array.from(monthly.entries()).map(([month, amount]) => ({ month, amount })),
    yearly: Array.from(yearly.entries()).map(([year, amount]) => ({ year, amount })),
    totals: {
      amount: totals.amount,
      count: totals.count,
      average: totals.count ? totals.amount / totals.count : 0,
    },
    trend: {
      current: totals.amount,
      previous: previousRevenue,
      growth: Number(growth.toFixed(2)),
    },
  };
}

async function createRevenue(userId, payload) {
  const amount = numberValue(payload?.amount);
  const type = String(payload?.type || "").trim();

  if (!amount || !type) {
    const error = new Error("Type and amount are required");
    error.status = 400;
    throw error;
  }

  return prisma.revenueReport.create({
    data: {
      userId,
      date: payload?.date ? new Date(payload.date) : new Date(),
      type,
      amount,
      currency: String(payload?.currency || "USD"),
      source: payload?.source || "manual",
      notes: payload?.notes || null,
    },
  });
}

module.exports = {
  listRevenue,
  createRevenue,
};
