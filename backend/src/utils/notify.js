const MAX_NOTIFICATIONS = 100; // per tenant limit

async function pruneOld(prisma, tenantId) {
  try {
    const total = await prisma.notification.count({ where: { tenantId } });
    if (total <= MAX_NOTIFICATIONS) return;

    // delete oldest read ones first, then unread if still over limit
    const excess = total - MAX_NOTIFICATIONS;
    const oldest = await prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      take: excess,
      select: { id: true },
    });
    await prisma.notification.deleteMany({
      where: { id: { in: oldest.map((n) => n.id) } },
    });
  } catch {
    // prune failure is non-fatal
  }
}

const notify = async (prisma, { tenantId, userId, title, message, type = "INFO" }) => {
  try {
    await prisma.notification.create({
      data: { tenantId, userId: userId || null, title, message, type },
    });
    await pruneOld(prisma, tenantId);
  } catch (err) {
    console.error("Notification write failed:", err.message);
  }
};

const notifyTenant = async (prisma, { tenantId, title, message, type = "INFO" }) => {
  try {
    await prisma.notification.create({
      data: { tenantId, userId: null, title, message, type },
    });
    await pruneOld(prisma, tenantId);
  } catch (err) {
    console.error("Notification write failed:", err.message);
  }
};

// Broadcasts to non-CLIENT users only — used for events raised by a client
// (e.g. an invoice request) that other clients in the same tenant must not see.
const notifyStaff = async (prisma, { tenantId, title, message, type = "INFO" }) => {
  try {
    const staff = await prisma.user.findMany({
      where: { tenantId, isDeleted: false, OR: [{ role: null }, { role: { name: { not: "CLIENT" } } }] },
      select: { id: true },
    });
    await Promise.all(
      staff.map((u) => prisma.notification.create({ data: { tenantId, userId: u.id, title, message, type } }))
    );
    await pruneOld(prisma, tenantId);
  } catch (err) {
    console.error("Notification write failed:", err.message);
  }
};

module.exports = { notify, notifyTenant, notifyStaff };
