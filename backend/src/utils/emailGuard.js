const prisma = require("../config/db");

// SystemUser.email is globally unique on its own table; tenant User.email is only
// unique per-tenant (@@unique([tenantId, email])) — nothing stops the same email
// existing in both tables. Since auth.routes.js checks SystemUser first on login,
// an email that exists in both would always resolve to the SystemUser account,
// silently locking the tenant account out. These two checks close that gap.
// Existing per-tenant behavior (same email across different tenants) is untouched.

async function assertEmailNotSystemUser(email, res) {
  const existing = await prisma.systemUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    res.status(409).json({ message: "This email is already used by a System Console account" });
    return false;
  }
  return true;
}

async function assertEmailNotTenantUser(email, res) {
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, isDeleted: false },
  });
  if (existing) {
    res.status(409).json({ message: "This email is already used by a company account" });
    return false;
  }
  return true;
}

module.exports = { assertEmailNotSystemUser, assertEmailNotTenantUser };
