const express = require("express");
const bcrypt  = require("bcrypt");
const prisma  = require("../config/db");
const audit   = require("../utils/audit");
const { superAdminExclusive } = require("../middleware/systemPermission.middleware");
const { assertEmailNotTenantUser } = require("../utils/emailGuard");

const router = express.Router();

// The full set of system-level tasks a Manager can be granted.
// Kept as a plain list (not a DB table) since it's small and fixed — unlike tenant
// Permission keys, these aren't user-editable.
const MANAGER_PERMISSIONS = [
  "COMPANY_VIEW", "COMPANY_CREATE", "COMPANY_UPDATE", "COMPANY_DELETE",
  "COMPANY_USERS_VIEW", "COMPANY_USER_RESET_PASSWORD",
  "BACKUP_VIEW", "BACKUP_CREATE", "BACKUP_DELETE",
  "SETTINGS_VIEW",
];

router.get("/permissions", superAdminExclusive, (req, res) => {
  res.json(MANAGER_PERMISSIONS);
});

router.get("/", superAdminExclusive, async (req, res) => {
  try {
    const managers = await prisma.systemUser.findMany({
      where:   { isSuperAdmin: false },
      select:  { id: true, name: true, email: true, permissions: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch managers", error: err.message });
  }
});

router.post("/", superAdminExclusive, async (req, res) => {
  const { name, email, password, permissions } = req.body;

  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ message: "Name, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  const grantedPerms = Array.isArray(permissions)
    ? permissions.filter((p) => MANAGER_PERMISSIONS.includes(p))
    : [];

  try {
    if (!(await assertEmailNotTenantUser(email.trim(), res))) return;

    const passwordHash = await bcrypt.hash(password, 10);
    const manager = await prisma.systemUser.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        isSuperAdmin: false,
        permissions: grantedPerms,
      },
      select: { id: true, name: true, email: true, permissions: true, createdAt: true },
    });

    await audit(prisma, { tenantId: null, userId: req.user.id, action: "CREATE", entity: "Manager", entityId: manager.id, entityName: manager.email, after: { permissions: grantedPerms }, req });

    res.status(201).json(manager);
  } catch (err) {
    if (err.code === "P2002")
      return res.status(409).json({ message: "Email already in use" });
    res.status(500).json({ message: "Failed to create manager", error: err.message });
  }
});

router.put("/:id", superAdminExclusive, async (req, res) => {
  const { id } = req.params;
  const { name, permissions, password } = req.body;

  try {
    const existing = await prisma.systemUser.findUnique({ where: { id } });
    if (!existing || existing.isSuperAdmin)
      return res.status(404).json({ message: "Manager not found" });

    const data = {};
    if (name?.trim()) data.name = name.trim();
    if (Array.isArray(permissions)) data.permissions = permissions.filter((p) => MANAGER_PERMISSIONS.includes(p));
    if (password) {
      if (password.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.systemUser.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, permissions: true, createdAt: true },
    });

    await audit(prisma, { tenantId: null, userId: req.user.id, action: "UPDATE", entity: "Manager", entityId: id, entityName: existing.email, before: { permissions: existing.permissions }, after: { permissions: updated.permissions }, req });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update manager", error: err.message });
  }
});

router.delete("/:id", superAdminExclusive, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.systemUser.findUnique({ where: { id } });
    if (!existing || existing.isSuperAdmin)
      return res.status(404).json({ message: "Manager not found" });

    await prisma.systemUser.delete({ where: { id } });

    await audit(prisma, { tenantId: null, userId: req.user.id, action: "DELETE", entity: "Manager", entityId: id, entityName: existing.email, before: { permissions: existing.permissions }, req });

    res.json({ message: "Manager removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete manager", error: err.message });
  }
});

module.exports = router;
