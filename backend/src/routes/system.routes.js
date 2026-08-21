const express = require("express");
const bcrypt  = require("bcrypt");
const prisma  = require("../config/db");

const router = express.Router();

function superAdminOnly(req, res, next) {
  if (req.user?.role !== "super_admin")
    return res.status(403).json({ message: "Super admin access required" });
  next();
}

/* ── GET /api/system/notifications
   Derives recent system events as transient notifications — no schema change needed.
   Reads super admin's dismissed-IDs from query (?read=id1,id2) if needed,
   but we keep it stateless: frontend manages "read" in-session. ── */
router.get("/notifications", superAdminOnly, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentTenants, nonActiveTenants] = await Promise.all([
      prisma.tenant.findMany({
        where:   { isDeleted: false, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" },
        take:    15,
        select:  { id: true, name: true, email: true, status: true, createdAt: true },
      }),
      prisma.tenant.findMany({
        where:   { isDeleted: false, status: { not: "ACTIVE" } },
        orderBy: { updatedAt: "desc" },
        take:    10,
        select:  { id: true, name: true, status: true, updatedAt: true },
      }),
    ]);

    const notifications = [];

    for (const t of recentTenants) {
      notifications.push({
        id:        `new-${t.id}`,
        title:     "New Company Registered",
        message:   `${t.name}${t.email ? ` (${t.email})` : ""} joined the platform`,
        type:      "INFO",
        createdAt: t.createdAt,
      });
    }

    for (const t of nonActiveTenants) {
      if (!recentTenants.find((r) => r.id === t.id)) {
        notifications.push({
          id:        `status-${t.id}`,
          title:     `Company ${t.status}`,
          message:   `${t.name} is currently ${t.status.toLowerCase()}`,
          type:      t.status === "SUSPENDED" ? "ERROR" : "WARNING",
          createdAt: t.updatedAt,
        });
      }
    }

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifications.slice(0, 20));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch system notifications", error: err.message });
  }
});

/* ── GET /api/system/profile ── */
router.get("/profile", superAdminOnly, async (req, res) => {
  try {
    const user = await prisma.systemUser.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ message: "Profile not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile", error: err.message });
  }
});

/* ── PUT /api/system/profile ── */
router.put("/profile", superAdminOnly, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

  try {
    const existing = await prisma.systemUser.findUnique({ where: { id: req.user.id } });
    if (!existing) return res.status(404).json({ message: "Profile not found" });

    const data = { name: name.trim() };

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: "Current password is required to set a new password" });
      const valid = await bcrypt.compare(currentPassword, existing.passwordHash);
      if (!valid)
        return res.status(401).json({ message: "Current password is incorrect" });
      if (newPassword.length < 6)
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.systemUser.update({
      where:  { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, updatedAt: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

/* ── GET /api/system/settings ── */
router.get("/settings", superAdminOnly, async (req, res) => {
  try {
    const [tenantCount, userCount, totalInvoices, totalPayments] = await Promise.all([
      prisma.tenant.count({ where: { isDeleted: false } }),
      prisma.user.count(),
      prisma.invoice.count({ where: { isDeleted: false } }),
      prisma.payment.count({ where: { isDeleted: false } }),
    ]);

    const planBreakdown = await prisma.tenant.groupBy({
      by:     ["plan"],
      where:  { isDeleted: false },
      _count: { _all: true },
    });

    const statusBreakdown = await prisma.tenant.groupBy({
      by:     ["status"],
      where:  { isDeleted: false },
      _count: { _all: true },
    });

    res.json({
      platform: {
        name:    "Urbanfeat ERP SaaS",
        version: "1.0.0",
      },
      stats: {
        tenants:       tenantCount,
        users:         userCount,
        invoices:      totalInvoices,
        payments:      totalPayments,
        planBreakdown: Object.fromEntries(planBreakdown.map((r) => [r.plan, r._count._all])),
        statusBreakdown: Object.fromEntries(statusBreakdown.map((r) => [r.status, r._count._all])),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load settings", error: err.message });
  }
});

module.exports = router;
