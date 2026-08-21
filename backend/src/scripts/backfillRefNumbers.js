/**
 * One-time backfill: assigns clientNumber, paymentNumber, userNumber
 * to all existing records that don't have them yet.
 *
 * Run with:  node backend/src/scripts/backfillRefNumbers.js
 */

const prisma = require("../config/db");

function toCode(name) {
  return (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase().substring(0, 3).padEnd(3, "X");
}

async function backfillClients() {
  const clients = await prisma.client.findMany({
    where:   { clientNumber: null },
    orderBy: { createdAt: "asc" },
    select:  { id: true, tenantId: true, name: true },
  });

  console.log(`Backfilling ${clients.length} client(s)…`);

  // Group by tenantId so sequential counters are per-tenant
  const counters = {};
  for (const c of clients) {
    const prefix = `CLT-${toCode(c.name)}`;
    const key    = `${c.tenantId}:${prefix}`;
    if (counters[key] === undefined) {
      // Count existing numbered records for this prefix in this tenant
      counters[key] = await prisma.client.count({
        where: { tenantId: c.tenantId, clientNumber: { startsWith: prefix } },
      });
    }
    counters[key] += 1;
    const clientNumber = `${prefix}-${String(counters[key]).padStart(3, "0")}`;
    await prisma.client.update({ where: { id: c.id }, data: { clientNumber } });
    console.log(`  Client ${c.name} → ${clientNumber}`);
  }
}

async function backfillPayments() {
  const payments = await prisma.payment.findMany({
    where:   { paymentNumber: null },
    orderBy: { createdAt: "asc" },
    include: { client: { select: { name: true } } },
  });

  console.log(`Backfilling ${payments.length} payment(s)…`);

  const counters = {};
  for (const p of payments) {
    const clientName = p.client?.name || "GEN";
    const prefix     = `PAY-${toCode(clientName)}`;
    const key        = `${p.tenantId}:${prefix}`;
    if (counters[key] === undefined) {
      counters[key] = await prisma.payment.count({
        where: { tenantId: p.tenantId, paymentNumber: { startsWith: prefix } },
      });
    }
    counters[key] += 1;
    const paymentNumber = `${prefix}-${String(counters[key]).padStart(3, "0")}`;
    await prisma.payment.update({ where: { id: p.id }, data: { paymentNumber } });
    console.log(`  Payment ${p.id.slice(-6)} → ${paymentNumber}`);
  }
}

async function backfillUsers() {
  const users = await prisma.user.findMany({
    where:   { userNumber: null },
    orderBy: { createdAt: "asc" },
    select:  { id: true, tenantId: true, name: true },
  });

  console.log(`Backfilling ${users.length} user(s)…`);

  const counters = {};
  for (const u of users) {
    const key = u.tenantId;
    if (counters[key] === undefined) {
      counters[key] = await prisma.user.count({
        where: { tenantId: u.tenantId, userNumber: { not: null } },
      });
    }
    counters[key] += 1;
    const userNumber = `USR-${String(counters[key]).padStart(4, "0")}`;
    await prisma.user.update({ where: { id: u.id }, data: { userNumber } });
    console.log(`  User ${u.name} → ${userNumber}`);
  }
}

async function main() {
  try {
    await backfillClients();
    await backfillPayments();
    await backfillUsers();
    console.log("\nBackfill complete.");
  } catch (err) {
    console.error("Backfill failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
