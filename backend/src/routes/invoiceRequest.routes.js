const express                = require("express");
const prisma                 = require("../config/db");
const audit                  = require("../utils/audit");
const { notify, notifyStaff } = require("../utils/notify");

const router = express.Router({ mergeParams: true });

const isClient = (req) => req.user?.role === "CLIENT";

/* ── GET / — admin: all requests (optional ?status=); client: own requests ── */
router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const { status } = req.query;

  const clientScope = isClient(req) ? { clientId: req.user.clientId } : {};

  try {
    const requests = await prisma.invoiceRequest.findMany({
      where: { tenantId, ...clientScope, ...(status && { status }) },
      include: {
        client:  { select: { id: true, prefix: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invoice requests", error: err.message });
  }
});

/* ── POST / — CLIENT only: submit a request ── */
router.post("/", async (req, res) => {
  if (!isClient(req)) return res.status(403).json({ message: "Only clients can submit invoice requests" });

  const { tenantId } = req.params;
  const clientId = req.user.clientId;
  const { projectId, title, notes } = req.body;

  const titleVal = (title || "").trim();
  if (!titleVal || titleVal.length < 3)
    return res.status(400).json({ message: "Please describe what the invoice is for (min 3 characters)" });

  try {
    const client = await prisma.client.findUnique({ where: { id: clientId, tenantId }, select: { status: true, name: true } });
    if (!client) return res.status(404).json({ message: "Client not found" });
    if (client.status !== "ACTIVE")
      return res.status(400).json({ message: "Your account is not active — contact the company to request an invoice" });

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId, tenantId }, select: { clientId: true, status: true, name: true } });
      if (!project || project.clientId !== clientId)
        return res.status(400).json({ message: "Invalid project" });
      if (project.status === "COMPLETED" || project.status === "CANCELLED")
        return res.status(400).json({ message: `Cannot request an invoice: project "${project.name}" is ${project.status.toLowerCase()}` });
    }

    const request = await prisma.invoiceRequest.create({
      data: { tenantId, clientId, projectId: projectId || null, title: titleVal, notes, requestedBy: req.user.id },
    });

    await audit(prisma, { tenantId, userId: req.user.id, action: "CREATE", entity: "InvoiceRequest", entityId: request.id, entityName: client.name, after: { title: titleVal, status: "PENDING" }, req });
    await notifyStaff(prisma, { tenantId, title: "New Invoice Request", message: `${client.name} requested an invoice: "${titleVal}"`, type: "INFO" });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit invoice request", error: err.message });
  }
});

/* ── PATCH /:id/fulfill — admin: link an already-created invoice to this request ── */
router.patch("/:id/fulfill", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { invoiceId } = req.body;
  if (!invoiceId) return res.status(400).json({ message: "invoiceId is required" });

  try {
    const request = await prisma.invoiceRequest.findFirst({ where: { id, tenantId } });
    if (!request) return res.status(404).json({ message: "Invoice request not found" });
    if (request.status !== "PENDING")
      return res.status(409).json({ message: `Request is already ${request.status.toLowerCase()}` });

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId, clientId: request.clientId } });
    if (!invoice) return res.status(400).json({ message: "Invoice does not belong to this client" });

    const updated = await prisma.invoiceRequest.update({
      where: { id },
      data: { status: "FULFILLED", invoiceId, resolvedBy: req.user.id, resolvedAt: new Date() },
    });

    await audit(prisma, { tenantId, userId: req.user.id, action: "FULFILL", entity: "InvoiceRequest", entityId: id, before: { status: "PENDING" }, after: { status: "FULFILLED", invoiceId }, req });
    if (request.requestedBy) {
      await notify(prisma, { tenantId, userId: request.requestedBy, title: "Invoice Request Fulfilled", message: `Your request "${request.title}" is ready — invoice ${invoice.invoiceNumber || invoice.id} has been created`, type: "SUCCESS" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to fulfill invoice request", error: err.message });
  }
});

/* ── PATCH /:id/decline — admin: decline with a reason ── */
router.patch("/:id/decline", async (req, res) => {
  if (isClient(req)) return res.status(403).json({ message: "Access denied" });

  const { tenantId, id } = req.params;
  const { reason } = req.body;

  try {
    const request = await prisma.invoiceRequest.findFirst({ where: { id, tenantId } });
    if (!request) return res.status(404).json({ message: "Invoice request not found" });
    if (request.status !== "PENDING")
      return res.status(409).json({ message: `Request is already ${request.status.toLowerCase()}` });

    const updated = await prisma.invoiceRequest.update({
      where: { id },
      data: { status: "DECLINED", declineReason: reason || null, resolvedBy: req.user.id, resolvedAt: new Date() },
    });

    await audit(prisma, { tenantId, userId: req.user.id, action: "DECLINE", entity: "InvoiceRequest", entityId: id, before: { status: "PENDING" }, after: { status: "DECLINED", declineReason: reason || null }, req });
    if (request.requestedBy) {
      await notify(prisma, { tenantId, userId: request.requestedBy, title: "Invoice Request Declined", message: reason ? `Your request "${request.title}" was declined: ${reason}` : `Your request "${request.title}" was declined`, type: "WARNING" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to decline invoice request", error: err.message });
  }
});

module.exports = router;
