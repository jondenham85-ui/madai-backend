const revenueService = require("../services/revenueService");

async function listRevenue(req, res, next) {
  try {
    const data = await revenueService.listRevenue(req.user.id);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return next(error);
  }
}

async function createRevenue(req, res, next) {
  try {
    const report = await revenueService.createRevenue(req.user.id, req.body);
    return res.status(201).json({ success: true, report });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listRevenue,
  createRevenue,
};
