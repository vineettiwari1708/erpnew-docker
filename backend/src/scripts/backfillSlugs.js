const prisma = require("../config/db");
const { genTenantSlug } = require("../utils/slug");

async function main() {
  const tenants = await prisma.tenant.findMany({
    where:   { slug: null, isDeleted: false },
    select:  { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Backfilling slugs for ${tenants.length} tenant(s)…`);

  for (const t of tenants) {
    const slug = await genTenantSlug(t.name, t.id);
    await prisma.tenant.update({ where: { id: t.id }, data: { slug } });
    console.log(`  ${t.name} → ${slug}`);
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
