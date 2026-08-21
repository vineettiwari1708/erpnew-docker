/**
 * One-time fix: backfill invoiceNumber on all existing invoices using the
 * new format  TENANT-CLIENT-PROJECT-001  (first 3 alpha chars of each name).
 *
 * Run:  node prisma/fix-invoice-numbers.js
 *
 * Safe to re-run — it will reassign numbers deterministically based on createdAt order.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function toCode(name) {
  const alpha = (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return alpha.substring(0, 3).padEnd(3, "X");
}

async function main() {
  // Fetch all invoices (including soft-deleted so we don't reuse their numbers)
  // ordered oldest-first so numbering is chronologically consistent
  const invoices = await prisma.invoice.findMany({
    include: {
      tenant:  { select: { name: true } },
      client:  { select: { name: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nFound ${invoices.length} invoice(s) to process.\n`);

  // Build sequential numbers per prefix
  const counters = {};
  const updates  = [];

  for (const inv of invoices) {
    const prefix = [
      toCode(inv.tenant?.name),
      toCode(inv.client?.name),
      toCode(inv.project?.name),
    ].join("-");

    counters[prefix] = (counters[prefix] || 0) + 1;
    const invoiceNumber = `${prefix}-${String(counters[prefix]).padStart(3, "0")}`;
    updates.push({ id: inv.id, old: inv.invoiceNumber || "(none)", invoiceNumber });
  }

  // Apply updates and print a log line per invoice
  for (const u of updates) {
    await prisma.invoice.update({
      where: { id: u.id },
      data:  { invoiceNumber: u.invoiceNumber },
    });
    const changed = u.old !== u.invoiceNumber;
    console.log(`  ${changed ? "✓" : "–"} ${u.id}  |  ${u.old.padEnd(24)} →  ${u.invoiceNumber}`);
  }

  console.log(`\nDone. ${updates.length} invoice(s) updated.\n`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
