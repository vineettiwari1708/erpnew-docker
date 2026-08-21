const audit = async (prisma, { tenantId, userId, action, entity, entityId, entityName, before, after, req }) => {
  try {
    // Embed entityName as __n inside `after` so no schema migration is needed.
    const afterData = after || entityName ? { ...(entityName ? { __n: entityName } : {}), ...(after || {}) } : undefined;

    await prisma.auditLog.create({
      data: {
        tenantId:  tenantId  || null,
        userId:    userId    || null,
        action,
        entity,
        entityId:  entityId  || null,
        before:    before    || undefined,
        after:     afterData || undefined,
        ipAddress: req?.ip   || null,
        userAgent: req?.headers?.["user-agent"] || null,
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
};

module.exports = audit;
