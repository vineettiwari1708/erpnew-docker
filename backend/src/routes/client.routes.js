const express          = require("express");
const bcrypt           = require("bcrypt");
const prisma           = require("../config/db");
const audit            = require("../utils/audit");
const { notifyTenant } = require("../utils/notify");
const { genClientNumber, genUserNumber } = require("../utils/refNumber");

const router = express.Router({ mergeParams: true });

const isClient = (req) => req.user?.role === "CLIENT";

/* ── GET all clients ── */
router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  try {
    if (isClient(req)) {
      // CLIENT users can only see their own record
      if (!req.user.clientId) return res.json([]);
      const own = await prisma.client.findFirst({
        where:   { id: req.user.clientId, tenantId, isDeleted: false },
        include: { _count: { select: { invoices: true, payments: true, projects: true } } },
      });
      return res.json(own ? [own] : []);
    }

    const { status, archived } = req.query;
    const showArchived = archived === "true";
    const clients = await prisma.client.findMany({
      where:   { tenantId, isDeleted: false, isArchived: showArchived, ...(status && { status }) },
      include: { _count: { select: { invoices: true, payments: true, projects: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch clients", error: err.message });
  }
});

/* ── GET single client ── */
router.get("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  if (isClient(req) && req.user.clientId !== id)
    return res.status(403).json({ message: "Access denied" });
  try {
    const client = await prisma.client.findFirst({
      where:   { id, tenantId, isDeleted: false },
      include: { _count: { select: { invoices: true, payments: true, projects: true } } },
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    // Include portal user status so the UI can show Create vs Reset
    const portalUser = await prisma.user.findFirst({
      where:  { clientId: id, tenantId, role: { name: "CLIENT" }, isDeleted: false },
      select: { id: true, email: true },
    });

    // Financial summary
    const invoices = await prisma.invoice.findMany({
      where:  { clientId: id, tenantId, isDeleted: false, status: { not: "CANCELLED" } },
      select: {
        id: true, totalAmount: true, status: true, dueDate: true,
        payments: { where: { isDeleted: false, status: "SUCCESS" }, select: { amount: true } },
      },
    });
    const totalBilled   = invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
    const totalPaid     = invoices.flatMap((i) => i.payments).reduce((s, p) => s + (p.amount || 0), 0);
    const outstanding   = totalBilled - totalPaid;
    const invoiceCount  = invoices.length;
    const paidCount     = invoices.filter((i) => i.status === "PAID").length;
    const overdueCount  = invoices.filter((i) => i.status === "OVERDUE").length;
    const draftCount    = invoices.filter((i) => i.status === "DRAFT").length;

    res.json({
      ...client,
      portalUser: portalUser || null,
      financials: { totalBilled, totalPaid, outstanding, invoiceCount, paidCount, overdueCount, draftCount },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch client", error: err.message });
  }
});

/* ── POST create client ── */
router.post("/", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId } = req.params;
  const {
    prefix, name, email, phone, company, website, gstNumber, industry, description, address, createdBy,
    portalEmail, portalPassword,
  } = req.body;

  if (!name) return res.status(400).json({ message: "Client name is required" });

  try {
    if (portalEmail && portalPassword) {
      const clientRole = await prisma.role.findFirst({ where: { tenantId, name: "CLIENT" } });
      if (!clientRole)
        return res.status(400).json({ message: "CLIENT role not found. Ensure the tenant has a CLIENT role." });

      const existingUser = await prisma.user.findFirst({ where: { email: portalEmail, tenantId } });
      if (existingUser)
        return res.status(409).json({ message: "Portal email is already in use by another user in this company." });

      const passwordHash = await bcrypt.hash(portalPassword, 10);

      const clientNumber = await genClientNumber(tenantId, name);
      const userNumber   = await genUserNumber(tenantId);

      const { client } = await prisma.$transaction(async (tx) => {
        const client = await tx.client.create({
          data: { tenantId, prefix, name, email, phone, company, website, gstNumber, industry, description, address, createdBy, clientNumber },
        });
        await tx.user.create({
          data: {
            tenantId,
            name,
            email:        portalEmail,
            passwordHash,
            roleId:       clientRole.id,
            clientId:     client.id,
            status:       "ACTIVE",
            userNumber,
          },
        });
        return { client };
      });

      await audit(prisma, { tenantId, userId: req.user?.id, action: "CREATE", entity: "Client", entityId: client.id, entityName: name, after: { portalCreated: true, portalEmail }, req });
      await notifyTenant(prisma, { tenantId, title: "New Client Added", message: `Client "${name}" was added with portal access`, type: "INFO" });

      return res.status(201).json({ ...client, portalCreated: true, portalEmail });
    }

    const clientNumber = await genClientNumber(tenantId, name);
    const client = await prisma.client.create({
      data: { tenantId, prefix, name, email, phone, company, website, gstNumber, industry, description, address, createdBy, clientNumber },
    });

    await audit(prisma, { tenantId, userId: req.user?.id, action: "CREATE", entity: "Client", entityId: client.id, entityName: name, after: { email, clientNumber }, req });
    await notifyTenant(prisma, { tenantId, title: "New Client Added", message: `Client "${name}" has been added`, type: "INFO" });

    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ message: "Failed to create client", error: err.message });
  }
});

/* ── PUT update client ── */
router.put("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { prefix, name, email, phone, company, website, gstNumber, industry, description, address, status } = req.body;

  try {
    const existing = await prisma.client.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!existing) return res.status(404).json({ message: "Client not found" });

    const client = await prisma.client.update({
      where: { id },
      data:  { prefix, name, email, phone, company, website, gstNumber, industry, description, address, status, updatedAt: new Date() },
    });

    await audit(prisma, {
      tenantId,
      userId:     req.user?.id,
      action:     "UPDATE",
      entity:     "Client",
      entityId:   id,
      entityName: existing.name,
      before: { name: existing.name, email: existing.email, phone: existing.phone, status: existing.status },
      after:  { name: client.name,   email: client.email,   phone: client.phone,   status: client.status },
      req,
    });

    res.json(client);
  } catch (err) {
    res.status(500).json({ message: "Failed to update client", error: err.message });
  }
});

/* ── POST create portal account for an existing client ── */
router.post("/:id/portal-user", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const client = await prisma.client.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const existing = await prisma.user.findFirst({
      where: { clientId: id, tenantId, role: { name: "CLIENT" }, isDeleted: false },
    });
    if (existing) return res.status(409).json({ message: "This client already has a portal account" });

    const emailInUse = await prisma.user.findFirst({ where: { email, tenantId } });
    if (emailInUse) return res.status(409).json({ message: "Email already in use by another account" });

    const clientRole = await prisma.role.findFirst({ where: { tenantId, name: "CLIENT" } });
    if (!clientRole) return res.status(400).json({ message: "CLIENT role not found" });

    const passwordHash = await bcrypt.hash(password, 10);
    const userNumber   = await genUserNumber(tenantId);
    const user = await prisma.user.create({
      data: { tenantId, name: client.name, email, passwordHash, roleId: clientRole.id, clientId: id, status: "ACTIVE", userNumber },
      select: { id: true, email: true, name: true, userNumber: true },
    });

    await audit(prisma, { tenantId, userId: req.user?.id, action: "CREATE", entity: "User", entityId: user.id, entityName: client.name, after: { portalEmail: email, clientId: id }, req });

    res.status(201).json({ message: "Portal account created", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to create portal account", error: err.message });
  }
});

/* ── POST reset client portal password ── */
router.post("/:id/reset-portal-password", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const portalUser = await prisma.user.findFirst({
      where: { clientId: id, tenantId, role: { name: "CLIENT" }, isDeleted: false },
    });
    if (!portalUser)
      return res.status(404).json({ message: "No portal account found for this client" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: portalUser.id },
      data:  { passwordHash, updatedAt: new Date() },
    });

    res.json({ message: "Portal password reset successfully", email: portalUser.email });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset portal password", error: err.message });
  }
});

/* ── GET client account statement ── */
router.get("/:id/statement", async (req, res) => {
  const { tenantId, id } = req.params;
  if (isClient(req) && req.user.clientId !== id)
    return res.status(403).json({ message: "Access denied" });
  try {
    const client = await prisma.client.findFirst({
      where:  { id, tenantId, isDeleted: false },
      select: { id: true, prefix: true, name: true, email: true, phone: true, company: true, address: true },
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const allInvoices = await prisma.invoice.findMany({
      where:   { tenantId, clientId: id, isDeleted: false },
      include: {
        project:  { select: { id: true, name: true } },
        payments: {
          where:  { isDeleted: false, status: "SUCCESS" },
          select: { id: true, amount: true, method: true, paidAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Active = exclude CANCELLED/voided invoices from financial summary
    const activeInvoices = allInvoices.filter((inv) => inv.status !== "CANCELLED");

    const totalBilled = activeInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
    const totalPaid   = activeInvoices.flatMap((inv) => inv.payments).reduce((s, p) => s + (p.amount || 0), 0);

    res.json({
      client,
      invoices: allInvoices, // send all (including voided) so UI can show strikethrough
      summary: {
        totalBilled,
        totalPaid,
        outstanding:  totalBilled - totalPaid,
        invoiceCount: activeInvoices.length,
        paidCount:    activeInvoices.filter((inv) => inv.status === "PAID").length,
        overdueCount: activeInvoices.filter((inv) => inv.status === "OVERDUE").length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch statement", error: err.message });
  }
});

/* ── PATCH archive / unarchive client ── */
router.patch("/:id/archive", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  try {
    const client = await prisma.client.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const nowArchived = !client.isArchived;
    const updated = await prisma.client.update({
      where: { id },
      data: {
        isArchived: nowArchived,
        archivedAt: nowArchived ? new Date() : null,
        updatedAt:  new Date(),
      },
    });

    await audit(prisma, {
      tenantId,
      userId:     req.user?.id,
      action:     nowArchived ? "ARCHIVE" : "UNARCHIVE",
      entity:     "Client",
      entityId:   id,
      entityName: client.name,
      after:      { isArchived: nowArchived },
      req,
    });

    res.json({ message: nowArchived ? "Client archived" : "Client unarchived", isArchived: nowArchived });
  } catch (err) {
    res.status(500).json({ message: "Failed to update archive status", error: err.message });
  }
});

/* ── DELETE client ── */
router.delete("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  try {
    const client = await prisma.client.findFirst({
      where:   { id, tenantId, isDeleted: false },
      include: { _count: { select: { invoices: true, payments: true } } },
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    if (client._count.invoices > 0 || client._count.payments > 0) {
      return res.status(409).json({
        message: "Client has existing invoices or payments and cannot be deleted. Disable the client instead.",
      });
    }

    await prisma.$transaction([
      prisma.project.deleteMany({ where: { clientId: id, tenantId } }),
      prisma.client.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } }),
    ]);

    await audit(prisma, { tenantId, userId: req.user?.id, action: "DELETE", entity: "Client", entityId: id, entityName: client.name, before: { name: client.name, email: client.email }, req });

    res.json({ message: "Client and associated projects deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete client", error: err.message });
  }
});

module.exports = router;
