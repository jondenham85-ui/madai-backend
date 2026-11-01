const roleHierarchy = {
  OWNER: 5,
  CO_OWNER: 4,
  FAMILY_ADMIN: 3,
  ADMIN: 2,
  USER: 1,
};

const DEFAULT_ROLE = "USER";

module.exports = {
  roleHierarchy,
  DEFAULT_ROLE,
};
