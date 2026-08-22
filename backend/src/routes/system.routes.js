const express    = require("express");
const bcrypt     = require("bcrypt");
const { spawn }  = require("child_process");
const fs         = require("fs");
const path       = require("path");
const prisma     = require("../config/db");

const BACKUP_DIR = "/app/backups";
const router = express.Router();

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

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

/* ── POST /api/system/backup — run pg_dump and save file ── */
router.post("/backup", superAdminOnly, async (req, res) => {
  try {
    const dbUrl  = new URL(process.env.DATABASE_URL);
    const host   = dbUrl.hostname;
    const port   = dbUrl.port || "5432";
    const user   = dbUrl.username;
    const pass   = dbUrl.password;
    const dbName = dbUrl.pathname.slice(1);

    const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup-${ts}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    await new Promise((resolve, reject) => {
      const proc = spawn(
        "pg_dump",
        ["-h", host, "-p", port, "-U", user, "-d", dbName, "-f", filepath, "--no-password"],
        { env: { ...process.env, PGPASSWORD: pass } }
      );
      proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exited with code ${code}`))));
      proc.on("error", reject);
    });

    const stat = fs.statSync(filepath);
    res.json({ filename, size: stat.size, createdAt: new Date().toISOString(), path: filepath });
  } catch (err) {
    res.status(500).json({ message: "Backup failed", error: err.message });
  }
});

/* ── GET /api/system/backups — list backup files ── */
router.get("/backups", superAdminOnly, (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return res.json([]);
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to list backups", error: err.message });
  }
});

/* ── GET /api/system/backup/:filename — download a backup file ── */
router.get("/backup/:filename", superAdminOnly, (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath))
    return res.status(404).json({ message: "Backup file not found" });
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  fs.createReadStream(filepath).pipe(res);
});

/* ── DELETE /api/system/backup/:filename — delete a backup file ── */
router.delete("/backup/:filename", superAdminOnly, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath))
    return res.status(404).json({ message: "Backup file not found" });
  fs.unlinkSync(filepath);
  res.json({ message: "Backup deleted" });
});

module.exports = router;
