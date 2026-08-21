// Send a notification to a specific user
const notify = async (prisma, { tenantId, userId, title, message, type = "INFO" }) => {
  try {
    await prisma.notification.create({
      data: { tenantId, userId: userId || null, title, message, type },
    });
  } catch (err) {
    console.error("Notification write failed:", err.message);
  }
};

// Broadcast to all users in tenant (userId: null = broadcast)
const notifyTenant = async (prisma, { tenantId, title, message, type = "INFO" }) => {
  try {
    await prisma.notification.create({
      data: { tenantId, userId: null, title, message, type },
    });
  } catch (err) {
    console.error("Notification write failed:", err.message);
  }
};

module.exports = { notify, notifyTenant };
