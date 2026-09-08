const express = require("express");
const prisma  = require("../config/db");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const { tenantId } = req.params;

  const isClient    = req.user.role === "CLIENT";
  const clientScope = isClient ? { clientId: req.user.clientId } : {};

  try {
    const [
      totalClients,
      totalProjects,
      totalInvoices,
      totalPayments,
      totalUsers,
      invoiceStats,
      recentInvoices,
      recentPayments,
      recentProjects,
    ] = await Promise.all([
      isClient
        ? Promise.resolve(1)
        : prisma.client.count({ where: { tenantId, isDeleted: false } }),
      prisma.project.count({ where: { tenantId, ...clientScope } }),
      prisma.invoice.count({ where: { tenantId, isDeleted: false, status: { not: "CANCELLED" }, ...clientScope } }),
      prisma.payment.count({ where: { tenantId, isDeleted: false, ...clientScope } }),
      isClient
        ? Promise.resolve(0)
        : prisma.user.count({
            where: { tenantId, isDeleted: false, NOT: { role: { name: "CLIENT" } } },
          }),

      prisma.invoice.groupBy({
        by: ["status"],
        where: { tenantId, isDeleted: false, status: { not: "CANCELLED" }, ...clientScope },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      prisma.invoice.findMany({
        where:   { tenantId, isDeleted: false, ...clientScope },
        orderBy: { createdAt: "desc" },
        take:    5,
        include: { client: { select: { name: true } } },
      }),

      prisma.payment.findMany({
        where:   { tenantId, isDeleted: false, ...clientScope },
        orderBy: { createdAt: "desc" },
        take:    5,
        include: { invoice: { select: { invoiceNumber: true } } },
      }),

      prisma.project.findMany({
        where:   { tenantId, ...clientScope },
        orderBy: { createdAt: "desc" },
        take:    5,
        select:  { id: true, name: true, code: true, status: true },
      }),
    ]);

    const revenue = invoiceStats.find((s) => s.status === "PAID")?._sum.totalAmount || 0;
    const pending = invoiceStats.find((s) => s.status === "PENDING")?._sum.totalAmount || 0;

    res.json({
      totalClients,
      totalProjects,
      totalInvoices,
      totalPayments,
      totalUsers,
      revenue,
      pendingAmount: pending,
      invoiceStats,
      recentInvoices,
      recentPayments,
      recentProjects,
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard load failed", error: err.message });
  }
});

module.exports = router;
