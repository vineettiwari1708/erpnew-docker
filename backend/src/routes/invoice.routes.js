const express                      = require("express");
const prisma                       = require("../config/db");
const { upload, uploadToImageKit } = require("../middleware/upload.middleware");
const audit                        = require("../utils/audit");
const { notifyTenant }             = require("../utils/notify");

const router = express.Router({ mergeParams: true });

const isClient = (req) => req.user?.role === "CLIENT";

const markOverdue = (tenantId) =>
  prisma.invoice.updateMany({
    where: {
      tenantId,
      status:   { in: ["PENDING", "APPROVED"] },
      dueDate:  { lt: new Date() },
      isDeleted: false,
    },
    data: { status: "OVERDUE", updatedAt: new Date() },
  });

router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const { clientId: qClientId, status } = req.query;

  const clientFilter =
    req.user.role === "CLIENT"
      ? { clientId: req.user.clientId }
      : qClientId ? { clientId: qClientId } : {};

  try {
    await markOverdue(tenantId);
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, isDeleted: false, ...clientFilter, ...(status && { status }) },
      include: {
        client:  { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count:  { select: { payments: true, ledger: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invoices", error: err.message });
  }
});

router.get("/client/:clientId", async (req, res) => {
  const { tenantId, clientId } = req.params;
  if (req.user.role === "CLIENT" && req.user.clientId !== clientId)
    return res.status(403).json({ message: "Access denied" });
  try {
    await markOverdue(tenantId);
    const invoices = await prisma.invoice.findMany({
      where:   { tenantId, clientId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch client invoices", error: err.message });
  }
});

router.get("/next-number", async (req, res) => {
  const { tenantId } = req.params;
  const { clientId, projectId } = req.query;

  if (!clientId) return res.status(400).json({ message: "clientId is required" });

  function toCode(name) {
    const alpha = (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    return alpha.substring(0, 3).padEnd(3, "X");
  }

  try {
    const [tenant, client, project] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
      prisma.client.findUnique({ where: { id: clientId },  select: { name: true } }),
      projectId
        ? prisma.project.findUnique({ where: { id: projectId }, select: { name: true } })
        : Promise.resolve(null),
    ]);

    const prefix = [
      toCode(tenant?.name),
      toCode(client?.name),
      toCode(project?.name),
    ].join("-");

    const count = await prisma.invoice.count({
      where: { tenantId, invoiceNumber: { startsWith: prefix + "-" } },
    });

    const invoiceNumber = `${prefix}-${String(count + 1).padStart(3, "0")}`;
    res.json({ invoiceNumber, prefix });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate invoice number", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  const clientScope = req.user.role === "CLIENT" ? { clientId: req.user.clientId } : {};
  try {
    await markOverdue(tenantId);
    // Accept invoiceNumber (e.g. INV-MET-001) OR raw cuid
    const invoice = await prisma.invoice.findFirst({
      where:   { tenantId, isDeleted: false, ...clientScope, OR: [{ id }, { invoiceNumber: id }] },
      include: {
        client:  { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        items:   true,
        payments: { where: { isDeleted: false } },
      },
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Resolve user names for createdBy and approvedBy
    const userIds = [invoice.createdBy, invoice.approvedBy].filter(Boolean);
    const users = userIds.length
      ? await prisma.user.findMany({
          where:  { id: { in: userIds }, tenantId },
          select: { id: true, name: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    res.json({
      ...invoice,
      createdByName:  invoice.createdBy  ? (userMap[invoice.createdBy]  ?? invoice.createdBy)  : null,
      approvedByName: invoice.approvedBy ? (userMap[invoice.approvedBy] ?? invoice.approvedBy) : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invoice", error: err.message });
  }
});

router.post("/", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId } = req.params;
  const { clientId, projectId, invoiceNumber, title, amount, tax = 0, discount = 0, dueDate, issueDate, notes, createdBy } = req.body;

  if (!clientId || !amount)
    return res.status(400).json({ message: "clientId and amount are required" });

  const a = Number(amount), t = Number(tax), d = Number(discount);

  try {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId, clientId, projectId, invoiceNumber, title,
        amount: a, tax: t, discount: d,
        totalAmount: a + t - d,
        dueDate:   dueDate   ? new Date(dueDate)   : null,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        notes, createdBy,
      },
    });

    await audit(prisma, { tenantId, userId: createdBy, action: "CREATE", entity: "Invoice", entityId: invoice.id, entityName: invoice.invoiceNumber, after: { totalAmount: invoice.totalAmount, clientId }, req });
    await notifyTenant(prisma, { tenantId, title: "New Invoice Created", message: `Invoice ${invoice.invoiceNumber || invoice.id} (₹${invoice.totalAmount}) has been created`, type: "INFO" });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Failed to create invoice", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { title, amount, tax, discount, dueDate, issueDate, notes, status } = req.body;

  try {
    const current = await prisma.invoice.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!current) return res.status(404).json({ message: "Invoice not found" });

    const a = amount   !== undefined ? Number(amount)   : current.amount;
    const t = tax      !== undefined ? Number(tax)      : current.tax;
    const d = discount !== undefined ? Number(discount) : current.discount;

    const invoice = await prisma.invoice.update({
      where: { id },
      data:  {
        title, amount: a, tax: t, discount: d, totalAmount: a + t - d,
        dueDate:   dueDate   ? new Date(dueDate)   : undefined,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        notes, status, updatedAt: new Date(),
      },
    });

    await audit(prisma, {
      tenantId,
      userId:     req.user?.id,
      action:     "UPDATE",
      entity:     "Invoice",
      entityId:   id,
      entityName: current.invoiceNumber,
      before: {
        title:       current.title,
        amount:      current.amount,
        tax:         current.tax,
        discount:    current.discount,
        totalAmount: current.totalAmount,
        dueDate:     current.dueDate,
        issueDate:   current.issueDate,
        status:      current.status,
        notes:       current.notes,
      },
      after: {
        title:       invoice.title,
        amount:      invoice.amount,
        tax:         invoice.tax,
        discount:    invoice.discount,
        totalAmount: invoice.totalAmount,
        dueDate:     invoice.dueDate,
        issueDate:   invoice.issueDate,
        status:      invoice.status,
        notes:       invoice.notes,
      },
      req,
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Failed to update invoice", error: err.message });
  }
});

router.patch("/:id/approve", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const approvedBy = req.user.id;

  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "PENDING")
      return res.status(400).json({ message: "Only PENDING invoices can be approved" });

    const updated = await prisma.invoice.update({
      where: { id },
      data:  { status: "APPROVED", approvedBy, approvedAt: new Date(), updatedAt: new Date() },
    });

    await audit(prisma, { tenantId, userId: approvedBy, action: "APPROVE", entity: "Invoice", entityId: id, entityName: invoice.invoiceNumber, before: { status: "PENDING" }, after: { status: "APPROVED" }, req });
    await notifyTenant(prisma, { tenantId, title: "Invoice Approved", message: `Invoice ${invoice.invoiceNumber || id} has been approved`, type: "SUCCESS" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message });
  }
});

router.post("/:id/confirm-payment", upload.single("proof"), async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { method, transactionId, notes } = req.body;
  // SystemUser (super_admin) rows aren't in the tenant-scoped User table, so
  // confirmedById / ledger.userId (which FK into User) must stay null for them.
  const confirmedBy = req.user.role === "super_admin" ? null : req.user.id;

  if (!method)
    return res.status(400).json({ message: "method is required" });

  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "APPROVED")
      return res.status(400).json({ message: "Only APPROVED invoices can receive payment confirmation" });

    let proofUrl = null;
    if (req.file) proofUrl = await uploadToImageKit(req.file);

    const now = new Date();

    const { payment, updatedInvoice } = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId:     id,
          clientId:      invoice.clientId,
          confirmedById: confirmedBy,
          amount:        invoice.totalAmount,
          status:        "SUCCESS",
          method,
          transactionId,
          proofUrl,
          notes,
          paidAt:       now,
          confirmedAt:  now,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data:  { status: "PAID", paidAt: now, updatedAt: now },
      });

      await tx.ledger.create({
        data: {
          tenantId,
          userId:      confirmedBy,
          invoiceId:   id,
          paymentId:   payment.id,
          type:        "CREDIT",
          amount:      invoice.totalAmount,
          source:      "INVOICE_PAYMENT",
          description: `Payment confirmed for ${invoice.invoiceNumber || id}`,
          referenceId: payment.id,
        },
      });

      return { payment, updatedInvoice };
    });

    await audit(prisma, { tenantId, userId: req.user?.id, action: "CONFIRM_PAYMENT", entity: "Invoice", entityId: id, entityName: invoice.invoiceNumber, before: { status: "APPROVED" }, after: { status: "PAID", amount: invoice.totalAmount }, req });
    await notifyTenant(prisma, { tenantId, title: "Payment Confirmed", message: `Payment of ₹${invoice.totalAmount} confirmed for invoice ${invoice.invoiceNumber || id}`, type: "SUCCESS" });

    res.json({ invoice: updatedInvoice, payment });
  } catch (err) {
    res.status(500).json({ message: "Payment confirmation failed", error: err.message });
  }
});

/* ── DELETE invoice
   Blocked when:
   - Status is APPROVED / PAID / OVERDUE (financial record)
   - Invoice has any payment records linked to it
   - Invoice has any ledger entries (deleting would orphan them)
   Only DRAFT or PENDING invoices with no financial activity can be removed. ── */
router.delete("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  try {
    const invoice = await prisma.invoice.findFirst({
      where:   { id, tenantId, isDeleted: false },
      include: { _count: { select: { payments: true, ledger: true } } },
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (["APPROVED", "PAID", "OVERDUE"].includes(invoice.status)) {
      return res.status(409).json({
        message: `Invoice is ${invoice.status} and cannot be deleted. Correct it instead.`,
      });
    }
    if (invoice._count.payments > 0) {
      return res.status(409).json({
        message: "Invoice has payment records and cannot be deleted. Correct it instead.",
      });
    }
    if (invoice._count.ledger > 0) {
      return res.status(409).json({
        message: "Invoice has ledger entries and cannot be deleted.",
      });
    }

    await prisma.invoice.update({
      where: { id },
      data:  { isDeleted: true, deletedAt: new Date() },
    });

    await audit(prisma, { tenantId, userId: req.user.id, action: "DELETE", entity: "Invoice", entityId: id, entityName: invoice.invoiceNumber, before: { status: invoice.status }, req });

    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete invoice", error: err.message });
  }
});

module.exports = router;
