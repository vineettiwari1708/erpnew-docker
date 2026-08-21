const prisma = require("../config/db");

async function tenantMiddleware(req, res, next) {
  const { tenantId: param } = req.params;

  if (!param)
    return res.status(400).json({ message: "tenantId is required" });

  if (req.user.role === "super_admin") return next();

  // If the URL param already matches the JWT's tenantId (raw cuid), skip DB lookup
  let resolvedId = param;
  if (param !== req.user.tenantId) {
    // Param is a slug — resolve to actual tenant ID
    const tenant = await prisma.tenant.findFirst({
      where:  { slug: param, isDeleted: false },
      select: { id: true },
    }).catch(() => null);

    if (!tenant)
      return res.status(403).json({ message: "Access denied to this tenant" });

    resolvedId = tenant.id;
  }

  if (req.user.tenantId !== resolvedId)
    return res.status(403).json({ message: "Access denied to this tenant" });

  // Normalise so all downstream route handlers see the cuid
  req.params.tenantId = resolvedId;
  next();
}

module.exports = tenantMiddleware;
