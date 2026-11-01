const { roleHierarchy } = require("../utils/constants");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const currentRole = req.user.role;
    const userLevel = roleHierarchy[currentRole] ?? 0;
    const allowedLevel = Math.max(...allowedRoles.map((role) => roleHierarchy[role] ?? 0));

    if (userLevel < allowedLevel) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access this resource",
      });
    }

    return next();
  };
}

module.exports = {
  authorizeRoles,
};
