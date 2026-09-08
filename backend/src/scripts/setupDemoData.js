/**
 * Setup demo tenant + roles + users for Urbanfeat ERP
 * Run: node backend/src/scripts/setupDemoData.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const ROLE_PERMISSIONS = {
  ADMIN: [
    "DASHBOARD_VIEW",
    "USER_VIEW","USER_CREATE","USER_UPDATE","USER_DELETE","USER_MANAGE",
    "CLIENT_VIEW","CLIENT_CREATE","CLIENT_UPDATE","CLIENT_DELETE",
    "PROJECT_VIEW","PROJECT_CREATE","PROJECT_UPDATE","PROJECT_DELETE",
    "INVOICE_VIEW","INVOICE_CREATE","INVOICE_UPDATE","INVOICE_DELETE","INVOICE_APPROVE",
    "PAYMENT_VIEW","PAYMENT_CREATE","PAYMENT_UPDATE","PAYMENT_DELETE","PAYMENT_CONFIRM",
    "LEDGER_VIEW",
    "ROLE_VIEW","ROLE_MANAGE",
    "REPORT_VIEW",
  ],
  MANAGER: [
    "DASHBOARD_VIEW",
    "USER_VIEW",
    "CLIENT_VIEW","CLIENT_CREATE","CLIENT_UPDATE",
    "PROJECT_VIEW","PROJECT_CREATE","PROJECT_UPDATE",
    "INVOICE_VIEW","INVOICE_CREATE","INVOICE_UPDATE",
    "PAYMENT_VIEW","PAYMENT_CREATE",
    "LEDGER_VIEW",
    "REPORT_VIEW",
  ],
  ACCOUNT: [
    "DASHBOARD_VIEW",
    "CLIENT_VIEW",
    "PROJECT_VIEW",
    "INVOICE_VIEW","INVOICE_CREATE","INVOICE_UPDATE","INVOICE_APPROVE",
    "PAYMENT_VIEW","PAYMENT_CREATE","PAYMENT_CONFIRM",
    "LEDGER_VIEW",
    "REPORT_VIEW",
  ],
  CLIENT: [
    "DASHBOARD_VIEW",
    "INVOICE_VIEW",
    "PAYMENT_VIEW","PAYMENT_CREATE",
  ],
};

async function main() {
  console.log("Setting up demo data...\n");

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where:  { email: "info@urbanfeat.in" },
    update: {},
    create: {
      name:    "Urbanfeat Construction Pvt Ltd",
      slug:    "urbanfeat",
      email:   "info@urbanfeat.in",
      phone:   "9876543210",
      status:  "ACTIVE",
      plan:    "PRO",
      industry:"Construction",
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Roles
  const roles = {};
  for (const roleName of ["ADMIN","MANAGER","ACCOUNT","CLIENT"]) {
    const role = await prisma.role.upsert({
      where:  { tenantId_name: { tenantId: tenant.id, name: roleName } },
      update: {},
      create: { tenantId: tenant.id, name: roleName },
    });
    roles[roleName] = role;
    console.log(`✅ Role: ${roleName}`);
  }

  // 3. Assign permissions to roles
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roles[roleName];
    for (const key of permKeys) {
      const perm = await prisma.permission.findUnique({ where: { key } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where:  { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
    console.log(`   Permissions assigned to ${roleName}`);
  }

  // 4. Users
  const users = [
    { name: "Admin User",    email: "admin@urbanfeat.in",    password: "admin123",    role: "ADMIN"   },
    { name: "Manager User",  email: "manager@urbanfeat.in",  password: "manager123",  role: "MANAGER" },
    { name: "Accounts Team", email: "accounts@urbanfeat.in", password: "accounts123", role: "ACCOUNT" },
    { name: "Client User",   email: "client@urbanfeat.in",   password: "client123",   role: "CLIENT"  },
  ];

  console.log("\nCreating users:");
  for (let i = 0; i < users.length; i++) {
    const { name, email, password, role } = users[i];
    const userNumber = `USR-${String(i + 1).padStart(4, "0")}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findFirst({ where: { tenantId: tenant.id, email, isDeleted: false } });
    if (existing) {
      console.log(`   ⚠ ${email} already exists — skipped`);
      continue;
    }
    await prisma.user.create({
      data: {
        tenantId:     tenant.id,
        roleId:       roles[role].id,
        name,
        email,
        passwordHash,
        userNumber,
        status:       "ACTIVE",
      },
    });
    console.log(`   ✅ ${role.padEnd(8)} | ${email.padEnd(28)} | password: ${password}`);
  }

  console.log("\n──────────────────────────────────────────────");
  console.log("Login credentials");
  console.log("──────────────────────────────────────────────");
  console.log("Super Admin  | vineet@admin.com        | vineet");
  console.log("Admin        | admin@urbanfeat.in      | admin123");
  console.log("Manager      | manager@urbanfeat.in    | manager123");
  console.log("Accounts     | accounts@urbanfeat.in   | accounts123");
  console.log("Client       | client@urbanfeat.in     | client123");
  console.log("──────────────────────────────────────────────\n");
}

main()
  .catch((e) => { console.error("Setup failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
