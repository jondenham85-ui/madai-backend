const { roleHierarchy } = require("../utils/constants");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userRole = req.user.role;
    const userLevel = roleHierarchy[userRole] ?? 0;
    const canAccess = allowedRoles.some((role) => {
      const requiredRoleLevel = roleHierarchy[role] ?? 0;
      return userLevel >= requiredRoleLevel;
    });

    if (!canAccess) {
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
