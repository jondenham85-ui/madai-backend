const analyticsService = require("../services/analyticsService");

async function getAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getAnalytics(req.user.id);
    return res.status(200).json({ success: true, ...analytics });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAnalytics,
};
