const express          = require("express");
const bcrypt           = require("bcrypt");
const prisma           = require("../config/db");
const audit            = require("../utils/audit");
const { notifyTenant } = require("../utils/notify");
const { genUserNumber } = require("../utils/refNumber");
const { assertEmailNotSystemUser } = require("../utils/emailGuard");

const router = express.Router({ mergeParams: true });

const isClient = (req) => req.user?.role === "CLIENT";

router.get("/", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });
  const { tenantId } = req.params;
  // ?all=true lets admin fetch everyone including CLIENT-role portal users
  const includeClients = req.query.all === "true";
  try {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        isDeleted: false,
        ...(includeClients ? {} : { NOT: { role: { name: "CLIENT" } } }),
      },
      include: { role: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const safe = users.map(({ passwordHash, ...u }) => u);
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

/* ── GET /me — logged-in user's own profile ── */
router.get("/me", async (req, res) => {
  const { tenantId } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where:   { id: req.user.id, tenantId, isDeleted: false },
      include: { role: { select: { id: true, name: true } } },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

/* ── PATCH /me — update own name / phone / department only ── */
router.patch("/me", async (req, res) => {
  const { tenantId } = req.params;
  const { name, phone, department } = req.body;

  if (!name?.trim())
    return res.status(400).json({ message: "Name is required" });

  try {
    const existing = await prisma.user.findFirst({ where: { id: req.user.id, tenantId, isDeleted: false } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name:       name.trim(),
        phone:      phone      !== undefined ? (phone      || null) : undefined,
        department: department !== undefined ? (department || null) : undefined,
        updatedAt:  new Date(),
      },
      include: { role: { select: { id: true, name: true } } },
    });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where:   { id, tenantId, isDeleted: false },
      include: { role: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
});

router.post("/", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId } = req.params;
  const { name, email, password, roleId, phone, department, clientId } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "name, email and password are required" });

  try {
    const exists = await prisma.user.findFirst({ where: { email, tenantId } });
    if (exists) return res.status(409).json({ message: "Email already in use" });
    if (!(await assertEmailNotSystemUser(email, res))) return;

    const passwordHash = await bcrypt.hash(password, 10);
    const userNumber   = await genUserNumber(tenantId);

    const user = await prisma.user.create({
      data: { tenantId, name, email, passwordHash, roleId, phone, department, clientId, userNumber },
      include: { role: { select: { id: true, name: true } } },
    });
    const { passwordHash: _, ...safe } = user;

    await audit(prisma, { tenantId, userId: req.user?.id, action: "CREATE", entity: "User", entityId: user.id, entityName: name, after: { email, roleId }, req });
    await notifyTenant(prisma, { tenantId, title: "New Staff Member Added", message: `User "${name}" (${email}) has been added`, type: "INFO" });

    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { name, email, phone, department, roleId, status, avatarUrl, newPassword } = req.body;

  try {
    const existing = await prisma.user.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    if (roleId) {
      const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
      if (!role) return res.status(400).json({ message: "Role does not belong to this tenant" });
    }

    if (email && email !== existing.email) {
      if (!(await assertEmailNotSystemUser(email, res))) return;
    }

    const updateData = { name, email, phone, department, roleId, status, avatarUrl, updatedAt: new Date() };

    if (newPassword) {
      if (newPassword.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data:  updateData,
      include: { role: { select: { id: true, name: true } } },
    });
    const { passwordHash, ...safe } = user;

    await audit(prisma, {
      tenantId,
      userId:     req.user?.id,
      action:     "UPDATE",
      entity:     "User",
      entityId:   id,
      entityName: existing.name,
      before: { name: existing.name, email: existing.email, status: existing.status, roleId: existing.roleId },
      after:  { name: updateData.name, email: updateData.email, status: updateData.status, roleId: updateData.roleId, ...(newPassword ? { passwordReset: true } : {}) },
      req,
    });

    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
});

/* ── PUT /:id/reset-password — admin or user with USER_MANAGE resets a user's password ── */
router.put("/:id/reset-password", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const userRole  = req.user?.role;
  const userPerms = req.user?.permissions || [];
  const canReset  = userRole === "ADMIN" || userPerms.includes("USER_MANAGE") || userPerms.includes("*");
  if (!canReset) return res.status(403).json({ message: "Permission denied: USER_MANAGE required" });

  const { tenantId, id } = req.params;
  const { newPassword }  = req.body;

  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const target = await prisma.user.findFirst({
      where:   { id, tenantId, isDeleted: false },
      include: { role: { select: { name: true } } },
    });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role?.name === "ADMIN")
      return res.status(403).json({ message: "Cannot reset company admin password" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    await audit(prisma, {
      tenantId, userId: req.user?.id, action: "UPDATE", entity: "User",
      entityId: id, entityName: target.name, after: { passwordReset: true }, req,
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
});

/* Users cannot be deleted — update status to INACTIVE/SUSPENDED to disable them.
   This route exists only to return a clear error if called directly. */
router.delete("/:id", (req, res) => {
  res.status(405).json({
    message:
      "Users cannot be deleted. Update the user's status to INACTIVE to disable their access.",
  });
});

module.exports = router;
