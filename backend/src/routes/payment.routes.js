const express                        = require("express");
const prisma                         = require("../config/db");
const { upload, uploadToImageKit }   = require("../middleware/upload.middleware");
const audit                          = require("../utils/audit");
const { genPaymentNumber }           = require("../utils/refNumber");

const router = express.Router({ mergeParams: true });

const isClient = (req) => req.user?.role === "CLIENT";

router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const { clientId: qClientId, status } = req.query;

  const clientFilter =
    req.user.role === "CLIENT"
      ? { clientId: req.user.clientId }
      : qClientId ? { clientId: qClientId } : {};

  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId, isDeleted: false, ...clientFilter, ...(status && { status }) },
      include: {
        invoice:     { select: { id: true, invoiceNumber: true, title: true } },
        client:      { select: { id: true, name: true } },
        confirmedBy: { select: { id: true, name: true } },
        _count:      { select: { ledger: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payments", error: err.message });
  }
});

router.get("/client/:clientId", async (req, res) => {
  const { tenantId, clientId } = req.params;
  if (req.user.role === "CLIENT" && req.user.clientId !== clientId)
    return res.status(403).json({ message: "Access denied" });
  try {
    const payments = await prisma.payment.findMany({
      where:   { tenantId, clientId, isDeleted: false },
      include: { invoice: { select: { id: true, invoiceNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch client payments", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  const clientScope = req.user.role === "CLIENT" ? { clientId: req.user.clientId } : {};
  try {
    // Accept paymentNumber (e.g. PAY-MET-001) OR raw cuid
    const payment = await prisma.payment.findFirst({
      where:   { tenantId, isDeleted: false, ...clientScope, OR: [{ id }, { paymentNumber: id }] },
      include: {
        invoice:     { select: { id: true, invoiceNumber: true, title: true, totalAmount: true } },
        client:      { select: { id: true, name: true } },
        confirmedBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
      },
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment", error: err.message });
  }
});

router.post("/", upload.single("proof"), async (req, res) => {
  const { tenantId } = req.params;
  const { invoiceId, clientId, amount, method, transactionId, notes, submittedById, paidAt, status } = req.body;

  if (!invoiceId || !amount || !method)
    return res.status(400).json({ message: "invoiceId, amount and method are required" });

  try {
    let proofUrl = null;
    if (req.file) proofUrl = await uploadToImageKit(req.file);

    // CLIENT users can only submit PENDING payment proofs — never force SUCCESS
    const paymentStatus = (!isClient(req) && status === "SUCCESS") ? "SUCCESS" : "PENDING";

    // Look up client name for reference number generation
    let clientName = "GEN";
    if (clientId) {
      const cl = await prisma.client.findFirst({ where: { id: clientId }, select: { name: true } });
      if (cl) clientName = cl.name;
    } else if (invoiceId) {
      const inv = await prisma.invoice.findFirst({ where: { id: invoiceId }, include: { client: { select: { name: true } } } });
      if (inv?.client) clientName = inv.client.name;
    }
    const paymentNumber = await genPaymentNumber(tenantId, clientName);

    if (paymentStatus === "SUCCESS") {
      /* Admin recording a confirmed payment — update invoice + create ledger atomically */
      const paidDate = paidAt ? new Date(paidAt) : new Date();

      const { payment } = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            tenantId, invoiceId, clientId,
            paymentNumber,
            amount:        Number(amount),
            status:        "SUCCESS",
            method,        transactionId, proofUrl, notes,
            confirmedById: req.user.id,
            paidAt:        paidDate,
            confirmedAt:   paidDate,
          },
        });

        await tx.invoice.update({
          where: { id: invoiceId },
          data:  { status: "PAID", paidAt: paidDate, updatedAt: new Date() },
        });

        const inv = await tx.invoice.findUnique({
          where:  { id: invoiceId },
          select: { invoiceNumber: true, totalAmount: true },
        });

        await tx.ledger.create({
          data: {
            tenantId,
            userId:      req.user.id,
            invoiceId,
            paymentId:   payment.id,
            type:        "CREDIT",
            amount:      Number(amount),
            source:      "INVOICE_PAYMENT",
            description: `Payment recorded for ${inv?.invoiceNumber || invoiceId}`,
            referenceId: payment.id,
          },
        });

        return { payment };
      });

      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { invoiceNumber: true } });
      await audit(prisma, { tenantId, userId: req.user?.id, action: "CONFIRM_PAYMENT", entity: "Payment", entityId: payment.id, entityName: inv?.invoiceNumber, after: { amount: Number(amount), method, status: "SUCCESS" }, req });

      return res.status(201).json(payment);
    }

    /* PENDING payment — just record it for later review */
    const payment = await prisma.payment.create({
      data: {
        tenantId, invoiceId, clientId,
        paymentNumber,
        amount: Number(amount),
        status: "PENDING",
        method, transactionId, proofUrl, notes, submittedById,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
    });

    const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { invoiceNumber: true } });
    await audit(prisma, { tenantId, userId: req.user?.id, action: "CREATE", entity: "Payment", entityId: payment.id, entityName: inv?.invoiceNumber, after: { amount: Number(amount), method, status: "PENDING" }, req });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: "Failed to create payment", error: err.message });
  }
});

router.put("/:id", upload.single("proof"), async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { amount, method, transactionId, notes, status, paidAt } = req.body;

  try {
    const existing = await prisma.payment.findFirst({ where: { id, tenantId, isDeleted: false } });
    if (!existing) return res.status(404).json({ message: "Payment not found" });

    let proofUrl = req.body.proofUrl || undefined;
    if (req.file) proofUrl = await uploadToImageKit(req.file);

    const payment = await prisma.payment.update({
      where: { id },
      data:  {
        amount: amount ? Number(amount) : undefined,
        method, transactionId, proofUrl, notes, status,
        paidAt: paidAt ? new Date(paidAt) : undefined,
        updatedAt: new Date(),
      },
    });

    const inv = await prisma.invoice.findUnique({ where: { id: existing.invoiceId }, select: { invoiceNumber: true } });
    await audit(prisma, {
      tenantId,
      userId:     req.user?.id,
      action:     "UPDATE",
      entity:     "Payment",
      entityId:   id,
      entityName: inv?.invoiceNumber,
      before: { amount: existing.amount, method: existing.method, status: existing.status },
      after:  { amount: payment.amount,  method: payment.method,  status: payment.status },
      req,
    });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Failed to update payment", error: err.message });
  }
});

/* ── DELETE payment
   Blocked when:
   - Status is SUCCESS (confirmed, settled transaction)
   - Payment has ledger entries (deleting would orphan them)
   Only PENDING or REJECTED payments with no ledger activity can be removed. ── */
router.delete("/:id", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  try {
    const payment = await prisma.payment.findFirst({
      where:   { id, tenantId, isDeleted: false },
      include: { _count: { select: { ledger: true } } },
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment._count.ledger > 0) {
      return res.status(409).json({
        message: "Payment has ledger entries and cannot be deleted. This is a confirmed transaction.",
      });
    }
    if (payment.status === "SUCCESS") {
      return res.status(409).json({
        message: "Confirmed payments cannot be deleted as they affect the ledger.",
      });
    }

    await prisma.payment.update({
      where: { id },
      data:  { isDeleted: true, deletedAt: new Date() },
    });

    const inv = await prisma.invoice.findUnique({ where: { id: payment.invoiceId }, select: { invoiceNumber: true } });
    await audit(prisma, { tenantId, userId: req.user?.id, action: "DELETE", entity: "Payment", entityId: id, entityName: inv?.invoiceNumber, before: { amount: payment.amount, method: payment.method, status: payment.status }, req });

    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete payment", error: err.message });
  }
});

module.exports = router;
