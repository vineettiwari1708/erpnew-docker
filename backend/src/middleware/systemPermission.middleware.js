// System-level (Super Admin console) permission gates.
// Distinct namespace from tenant Permission keys — see backend/src/routes/manager.routes.js
// for the full list: COMPANY_*, BACKUP_*, SETTINGS_VIEW.

// Any logged-in system-level account (true Super Admin OR a Manager) with the given
// permission key. isSuperAdmin always short-circuits via "*".
function requireSystemPermission(key) {
  return (req, res, next) => {
    if (req.user?.role !== "super_admin")
      return res.status(403).json({ message: "Super admin access required" });

    const perms = req.user.permissions || [];
    if (req.user.isSuperAdmin === true || perms.includes("*") || perms.includes(key))
      return next();

    return res.status(403).json({ message: "You don't have permission to perform this action" });
  };
}

// Hard-coded to the true Super Admin only — never grantable to a Manager via any
// permission key. Used exclusively for managing Manager accounts themselves, so a
// Manager can never escalate their own or another Manager's access.
function superAdminExclusive(req, res, next) {
  if (req.user?.role !== "super_admin" || req.user?.isSuperAdmin !== true)
    return res.status(403).json({ message: "Super admin access required" });
  next();
}

module.exports = { requireSystemPermission, superAdminExclusive };
