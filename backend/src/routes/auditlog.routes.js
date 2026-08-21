const express = require("express");
const prisma  = require("../config/db");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const { entity, limit = 100 } = req.query;

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(entity && { entity }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit) || 100, 500),
    });

    // Batch-resolve actor names from the users table
    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where:  { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    // Enrich each log: extract __n entity name, clean it from the diff data
    const enriched = logs.map((log) => {
      const rawAfter = log.after || {};
      const { __n: entityName, ...cleanAfter } = rawAfter;

      return {
        ...log,
        actorName:  log.userId ? (userMap[log.userId] || "Unknown") : "System",
        entityName: entityName || null,
        after:      Object.keys(cleanAfter).length ? cleanAfter : null,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
});

module.exports = router;
