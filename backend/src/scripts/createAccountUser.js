/**
 * Creates a test ACCOUNT role user for the Urbanfeat tenant.
 * Run with: node backend/src/scripts/createAccountUser.js
 */

const bcrypt = require("bcrypt");
const prisma  = require("../config/db");

async function main() {
  // Find the tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "urbanfeat-construction-pvt-ltd", isDeleted: false },
    select: { id: true, name: true },
  });
  if (!tenant) throw new Error("Tenant not found");

  // Find the ACCOUNT role for this tenant
  const role = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: "ACCOUNT" },
    select: { id: true },
  });
  if (!role) throw new Error("ACCOUNT role not found for tenant");

  // Count existing users to generate userNumber
  const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
  const userNumber = `USR-${String(userCount + 1).padStart(4, "0")}`;

  const email        = "accounts@urbanfeat.in";
  const passwordHash = await bcrypt.hash("accounts123", 10);

  const existing = await prisma.user.findFirst({ where: { email, isDeleted: false } });
  if (existing) {
    console.log(`User ${email} already exists (${existing.userNumber || existing.id})`);
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      roleId:       role.id,
      name:         "Accounts Team",
      email,
      passwordHash,
      userNumber,
      status:       "ACTIVE",
    },
    select: { id: true, name: true, email: true, userNumber: true },
  });

  console.log("Account user created:");
  console.log(`  Name:       ${user.name}`);
  console.log(`  Email:      ${user.email}`);
  console.log(`  Password:   accounts123`);
  console.log(`  User No.:   ${user.userNumber}`);
  console.log(`  Role:       ACCOUNT`);
  console.log(`  Tenant:     ${tenant.name}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
