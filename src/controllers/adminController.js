const adminService = require("../services/adminService");

async function getUsers(req, res, next) {
  try {
    const users = await adminService.listUsers();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return next(error);
  }
}

async function getDirectives(req, res, next) {
  try {
    const directives = await adminService.listDirectives();
    return res.status(200).json({ success: true, directives });
  } catch (error) {
    return next(error);
  }
}

async function getSystemSummary(req, res, next) {
  try {
    const summary = await adminService.getSystemSummary();
    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getDirectives,
  getSystemSummary,
};
