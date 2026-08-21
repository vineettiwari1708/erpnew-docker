/**
 * Production seed — run once on fresh deployment
 * Seeds: global RBAC permissions + super admin account
 * Run: node prisma/seed.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding production data...\n");

  // ── Global Permission Keys (shared across all tenants) ──
  const permKeys = [
    "DASHBOARD_VIEW",
    "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE", "USER_MANAGE",
    "CLIENT_VIEW", "CLIENT_CREATE", "CLIENT_UPDATE", "CLIENT_DELETE",
    "PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE",
    "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE", "INVOICE_APPROVE",
    "PAYMENT_VIEW", "PAYMENT_CREATE", "PAYMENT_UPDATE", "PAYMENT_DELETE", "PAYMENT_CONFIRM",
    "LEDGER_VIEW",
    "ROLE_VIEW", "ROLE_MANAGE",
    "REPORT_VIEW",
  ];

  for (const key of permKeys) {
    await prisma.permission.upsert({
      where:  { key },
      update: {},
      create: { key },
    });
  }
  console.log(`✅ ${permKeys.length} global permissions seeded`);

  // ── Super Admin ──
  const superAdminEmail    = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminName     = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error(
      "Missing env vars. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before seeding.\n" +
      "Example: SUPER_ADMIN_EMAIL=admin@company.com SUPER_ADMIN_PASSWORD=strongpass node prisma/seed.js"
    );
  }

  await prisma.systemUser.upsert({
    where:  { email: superAdminEmail },
    update: {},
    create: {
      name:         superAdminName,
      email:        superAdminEmail,
      passwordHash: await bcrypt.hash(superAdminPassword, 10),
      isSuperAdmin: true,
    },
  });
  console.log(`✅ Super admin seeded: ${superAdminEmail}`);

  console.log("\nSeed complete!");
  console.log("─────────────────────────────");
  console.log(`Super admin ready: ${superAdminEmail}`);
  console.log("─────────────────────────────");
}

main()
  .catch((e) => { console.error("Seed failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
