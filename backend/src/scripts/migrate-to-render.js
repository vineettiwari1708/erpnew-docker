/**
 * migrate-to-render.js
 *
 * Copies ALL data from your local PostgreSQL database to the Render production
 * database, wiping whatever is on Render first.
 *
 * Usage (run from the backend/ directory):
 *   RENDER_DB="postgresql://..." node src/scripts/migrate-to-render.js
 *
 * Or paste your Render DATABASE_URL directly into RENDER_URL below.
 */

const { PrismaClient } = require("@prisma/client");

// ─── CONFIGURE THESE ───────────────────────────────────────────────────────
const LOCAL_URL  = "postgresql://postgres:123456@localhost:5432/saas_db";
const RENDER_URL = process.env.RENDER_DB || ""; // paste Render DATABASE_URL here
// ───────────────────────────────────────────────────────────────────────────

if (!RENDER_URL) {
  console.error(
    "\n❌  RENDER_DB is not set.\n" +
    "    Run:  RENDER_DB=\"postgresql://...\" node src/scripts/migrate-to-render.js\n" +
    "    Or paste your Render DATABASE_URL into the RENDER_URL variable in this script.\n"
  );
  process.exit(1);
}

const src  = new PrismaClient({ datasources: { db: { url: LOCAL_URL  } } });
const dest = new PrismaClient({ datasources: { db: { url: RENDER_URL } } });

/* ── helpers ── */
function log(table, count) {
  const label = count === 0 ? "skip (empty)" : `${count} rows`;
  console.log(`  ✅  ${table.padEnd(18)} ${label}`);
}

async function copyTable(name, rows, insertFn) {
  if (!rows.length) { log(name, 0); return; }
  await insertFn(rows);
  log(name, rows.length);
}

/* ── main ── */
async function main() {
  console.log("\n🔗  Connecting to local and Render databases...");
  await src.$connect();
  await dest.$connect();
  console.log("✅  Connected\n");

  /* ────────────────────────────────────────────────────────────
     STEP 1 — Wipe EVERYTHING on Render (CASCADE handles FKs)
  ──────────────────────────────────────────────────────────── */
  console.log("🗑️   Wiping Render database...");
  await dest.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog",
      "Notification",
      "Ledger",
      "Payment",
      "InvoiceItem",
      "Invoice",
      "Project",
      "RefreshToken",
      "UserPermission",
      "User",
      "RolePermission",
      "Role",
      "Client",
      "Tenant",
      "SystemUser",
      "Permission"
    RESTART IDENTITY CASCADE
  `);
  console.log("✅  Render DB wiped\n");

  /* ────────────────────────────────────────────────────────────
     STEP 2 — Copy data in foreign-key dependency order
  ──────────────────────────────────────────────────────────── */
  console.log("📦  Copying tables...\n");

  // No FKs
  await copyTable("Permission",
    await src.permission.findMany(),
    (d) => dest.permission.createMany({ data: d, skipDuplicates: true })
  );

  await copyTable("SystemUser",
    await src.systemUser.findMany(),
    (d) => dest.systemUser.createMany({ data: d, skipDuplicates: true })
  );

  await copyTable("Tenant",
    await src.tenant.findMany(),
    (d) => dest.tenant.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant
  await copyTable("Role",
    await src.role.findMany(),
    (d) => dest.role.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Role + Permission
  await copyTable("RolePermission",
    await src.rolePermission.findMany(),
    (d) => dest.rolePermission.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant
  await copyTable("Client",
    await src.client.findMany(),
    (d) => dest.client.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant, Role, Client
  await copyTable("User",
    await src.user.findMany(),
    (d) => dest.user.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on User + Permission
  await copyTable("UserPermission",
    await src.userPermission.findMany(),
    (d) => dest.userPermission.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on User
  await copyTable("RefreshToken",
    await src.refreshToken.findMany(),
    (d) => dest.refreshToken.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant, Client
  await copyTable("Project",
    await src.project.findMany(),
    (d) => dest.project.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant, Client, Project
  await copyTable("Invoice",
    await src.invoice.findMany(),
    (d) => dest.invoice.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Invoice
  await copyTable("InvoiceItem",
    await src.invoiceItem.findMany(),
    (d) => dest.invoiceItem.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant, Invoice, Client, User
  await copyTable("Payment",
    await src.payment.findMany(),
    (d) => dest.payment.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant, User, Invoice, Payment
  await copyTable("Ledger",
    await src.ledger.findMany(),
    (d) => dest.ledger.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant
  await copyTable("Notification",
    await src.notification.findMany(),
    (d) => dest.notification.createMany({ data: d, skipDuplicates: true })
  );

  // Depends on Tenant
  await copyTable("AuditLog",
    await src.auditLog.findMany(),
    (d) => dest.auditLog.createMany({ data: d, skipDuplicates: true })
  );

  console.log("\n🎉  Migration complete! Local → Render done.\n");
}

main()
  .catch((err) => {
    console.error("\n❌  Migration failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await src.$disconnect();
    await dest.$disconnect();
  });
