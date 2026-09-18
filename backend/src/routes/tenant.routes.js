const express = require("express");
const bcrypt  = require("bcrypt");
const prisma  = require("../config/db");
const { genTenantSlug } = require("../utils/slug");
const { requireSystemPermission } = require("../middleware/systemPermission.middleware");
const { assertEmailNotSystemUser } = require("../utils/emailGuard");

const router = express.Router();

const ROLE_PERMISSIONS = {
  ADMIN: [
    "DASHBOARD_VIEW",
    "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE", "USER_MANAGE",
    "CLIENT_VIEW", "CLIENT_CREATE", "CLIENT_UPDATE", "CLIENT_DELETE",
    "PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE",
    "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE", "INVOICE_APPROVE",
    "PAYMENT_VIEW", "PAYMENT_CREATE", "PAYMENT_UPDATE", "PAYMENT_DELETE", "PAYMENT_CONFIRM",
    "LEDGER_VIEW", "ROLE_VIEW", "ROLE_MANAGE", "REPORT_VIEW",
  ],
  MANAGER: [
    "DASHBOARD_VIEW",
    "CLIENT_VIEW",
    "PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE",
    "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_APPROVE",
    "PAYMENT_VIEW", "PAYMENT_CREATE", "PAYMENT_CONFIRM",
    "LEDGER_VIEW",
  ],
  ACCOUNT: [
    "DASHBOARD_VIEW",
    "CLIENT_VIEW",
    "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE",
    "PAYMENT_VIEW", "PAYMENT_CREATE", "PAYMENT_UPDATE",
    "LEDGER_VIEW",
  ],
  CLIENT: [
    "DASHBOARD_VIEW",
    "INVOICE_VIEW",
    "PAYMENT_VIEW", "PAYMENT_CREATE",
  ],
};

/* ── GET all tenants ── */
router.get("/", requireSystemPermission("COMPANY_VIEW"), async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where:   { isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, clients: true, invoices: true } },
      },
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tenants", error: err.message });
  }
});

/* ── GET single tenant ── */
router.get("/:id", requireSystemPermission("COMPANY_VIEW"), async (req, res) => {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tenant", error: err.message });
  }
});

/* ── POST — create tenant + roles + admin user (atomic) ── */
router.post("/", requireSystemPermission("COMPANY_CREATE"), async (req, res) => {
  const {
    name, email, phone, website, industry, employees,
    plan, status, gstNumber, gstEnabled, gstType, gstRate,
    address, description,
    adminName, adminEmail, adminPassword,
  } = req.body;

  if (!name?.trim())
    return res.status(400).json({ message: "Company name is required" });
  if (!adminEmail?.trim() || !adminPassword)
    return res.status(400).json({ message: "Admin email and password are required" });
  if (adminPassword.length < 6)
    return res.status(400).json({ message: "Admin password must be at least 6 characters" });

  try {
    if (!(await assertEmailNotSystemUser(adminEmail.trim(), res))) return;

    // Generate slug outside the transaction (needs DB reads)
    const slug = await genTenantSlug(name.trim());

    const result = await prisma.$transaction(async (tx) => {
      /* 1 — tenant */
      const tenant = await tx.tenant.create({
        data: {
          name: name.trim(),
          slug,
          email:    email    || null,
          phone:    phone    || null,
          website:  website  || null,
          industry: industry || null,
          description: description || null,
          employees: employees ? Number(employees) : null,
          plan:   plan   || "FREE",
          status: status || "ACTIVE",
          gstNumber:  gstNumber  || null,
          gstEnabled: Boolean(gstEnabled),
          gstType:    gstType    || null,
          gstRate:    gstRate    ? Number(gstRate) : null,
          address:    address    || null,
        },
      });

      /* 2 — roles with permissions */
      const allPerms = await tx.permission.findMany();
      const permMap  = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));

      const roles = {};
      for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await tx.role.create({
          data: { tenantId: tenant.id, name: roleName },
        });
        roles[roleName] = role.id;

        const validKeys = keys.filter((k) => permMap[k]);
        if (validKeys.length > 0) {
          await tx.rolePermission.createMany({
            data: validKeys.map((k) => ({ roleId: role.id, permissionId: permMap[k] })),
            skipDuplicates: true,
          });
        }
      }

      /* 3 — admin user */
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminUser = await tx.user.create({
        data: {
          tenantId:     tenant.id,
          roleId:       roles.ADMIN,
          name:         adminName?.trim() || name.trim() + " Admin",
          email:        adminEmail.trim().toLowerCase(),
          passwordHash,
          status:       "ACTIVE",
        },
        include: { role: { select: { id: true, name: true } } },
      });

      const { passwordHash: _pw, ...safeAdmin } = adminUser;
      return { tenant, adminUser: safeAdmin };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === "P2002")
      return res.status(409).json({ message: "Email already in use for another account" });
    res.status(500).json({ message: "Failed to create company", error: err.message });
  }
});

/* ── PUT — update tenant info ── */
router.put("/:id", requireSystemPermission("COMPANY_UPDATE"), async (req, res) => {
  const { id } = req.params;
  const {
    name, email, phone, website, industry, employees,
    plan, status, gstNumber, gstEnabled, gstType, gstRate,
    address, description,
  } = req.body;

  try {
    const existing = await prisma.tenant.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return res.status(404).json({ message: "Tenant not found" });

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name, email, phone, website, industry, description,
        employees:  employees  !== undefined ? Number(employees)  : undefined,
        gstRate:    gstRate    !== undefined ? Number(gstRate)    : undefined,
        plan, status, gstNumber, gstEnabled, gstType, address,
        updatedAt: new Date(),
      },
    });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: "Failed to update tenant", error: err.message });
  }
});

/* ── DELETE — soft delete tenant ── */
router.delete("/:id", requireSystemPermission("COMPANY_DELETE"), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.tenant.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return res.status(404).json({ message: "Tenant not found" });

    await prisma.tenant.update({
      where: { id },
      data:  { isDeleted: true, deletedAt: new Date() },
    });
    res.json({ message: "Tenant deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete tenant", error: err.message });
  }
});

/* ── GET /:tenantId/users — list all users for a company ── */
router.get("/:tenantId/users", requireSystemPermission("COMPANY_USERS_VIEW"), async (req, res) => {
  const { tenantId } = req.params;
  try {
    const users = await prisma.user.findMany({
      where:   { tenantId, isDeleted: false },
      select:  { id: true, name: true, email: true, status: true, userNumber: true, role: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

/* ── PUT /:tenantId/users/:userId/reset-password ── */
router.put("/:tenantId/users/:userId/reset-password", requireSystemPermission("COMPANY_USER_RESET_PASSWORD"), async (req, res) => {
  const { tenantId, userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const user = await prisma.user.findFirst({
      where:   { id: userId, tenantId, isDeleted: false },
      include: { role: { select: { name: true } } },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role?.name === "ADMIN")
      return res.status(403).json({ message: "Cannot reset company admin password" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
});

module.exports = router;
