const express = require("express");
const prisma  = require("../config/db");

const router = express.Router({ mergeParams: true });

/* ── GET notifications for current user (own + broadcasts) ── */
router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const userId = req.user.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        tenantId,
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
});

/* ── PATCH /read-all — mark all as read  (MUST come before /:id/read) ── */
router.patch("/read-all", async (req, res) => {
  const { tenantId } = req.params;
  const userId = req.user.id;

  try {
    await prisma.notification.updateMany({
      where: {
        tenantId,
        OR: [{ userId }, { userId: null }],
        read: false,
      },
      data: { read: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read", error: err.message });
  }
});

/* ── PATCH /:id/read — mark one notification as read ── */
router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    const notif = await prisma.notification.update({
      where: { id },
      data:  { read: true },
    });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notification as read", error: err.message });
  }
});

module.exports = router;
