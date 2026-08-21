const prisma = require("../config/db");

function toSlugBase(name) {
  return (name || "tenant")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40);
}

async function genTenantSlug(name, excludeId = null) {
  const base = toSlugBase(name);
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await prisma.tenant.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    slug = `${base}-${n++}`;
  }
}

module.exports = { toSlugBase, genTenantSlug };
