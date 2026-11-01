const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function toNumber(value) {
  return Number(value); 
}

async function listRevenue(userId) {
  const reports = await prisma.revenueReport.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const totals = reports.reduce(
    (acc, report) => {
      acc.amount += toNumber(report.amount);
      acc.count += 1;
      return acc;
    },
    { amount: 0, count: 0 }
  );

  const daily = [];
  const weekly = [];
  const monthly = [];
  const yearly = [];

  const dateMap = new Map();

  for (const report of reports) {
    const date = new Date(report.date);
    const keyDay = date.toISOString().slice(0, 10);
    const keyMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const keyYear = String(date.getFullYear());

    dateMap.set(keyDay, (dateMap.get(keyDay) || 0) + toNumber(report.amount));
    dateMap.set(`month:${keyMonth}`, (dateMap.get(`month:${keyMonth}`) || 0) + toNumber(report.amount));
    dateMap.set(`year:${keyYear}`, (dateMap.get(`year:${keyYear}`) || 0) + toNumber(report.amount));
  }

  for (const [key, value] of dateMap.entries()) {
    if (!key.includes("month:") && !key.includes("year:")) {
      daily.push({ date: key, amount: value });
    }
    if (key.includes("month:")) {
      monthly.push({ month: key.replace("month:", ""), amount: value });
    }
    if (key.includes("year:")) {
      yearly.push({ year: key.replace("year:", ""), amount: value });
    }
  }

  const trend = reports.length
    ? {
        current: totals.amount,
        previous: Math.max(0, totals.amount - reports.at(-1)?.amount || 0),
        growth: 0,
      }
    : { current: 0, previous: 0, growth: 0 };

  return {
    daily: daily.sort((a, b) => a.date.localeCompare(b.date)),
    weekly: weekly.length ? weekly : [{ week: "current", amount: totals.amount }],
    monthly: monthly.sort((a, b) => a.month.localeCompare(b.month)),
    yearly: yearly.sort((a, b) => a.year.localeCompare(b.year)),
    totals: {
      amount: totals.amount,
      count: totals.count,
      average: totals.count ? totals.amount / totals.count : 0,
    },
    trend,
  };
}

async function createRevenue(userId, payload) {
  const amount = Number(payload.amount || 0);
  const type = String(payload.type || "sale").trim();
  const date = payload.date ? new Date(payload.date) : new Date();

  if (!amount || !type) {
    const error = new Error("Type and amount are required");
    error.status = 400;
    throw error;
  }

  const report = await prisma.revenueReport.create({
    data: {
      userId,
      date,
      type,
      amount,
      currency: payload.currency || "USD",
      source: payload.source || "manual",
      notes: payload.notes || null,
    },
  });

  return report;
}

module.exports = {
  listRevenue,
  createRevenue,
};
