const { checkPermission, checkRole, superAdminOnly, adminOnly } = require('./rbac');

module.exports = {
  checkPermission,
  checkRole,
  superAdminOnly,
  adminOnly
};