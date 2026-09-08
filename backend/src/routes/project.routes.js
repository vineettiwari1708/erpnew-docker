const express = require("express");
const prisma  = require("../config/db");

const router = express.Router({ mergeParams: true });

/* ── GET all projects (includes invoice count for UI decisions) ── */
router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const { clientId: qClientId, status } = req.query;

  const clientFilter =
    req.user.role === "CLIENT"
      ? { clientId: req.user.clientId }
      : qClientId ? { clientId: qClientId } : {};

  try {
    const projects = await prisma.project.findMany({
      where: { tenantId, ...clientFilter, ...(status && { status }) },
      include: {
        client:   { select: { id: true, prefix: true, name: true } },
        _count:   { select: { invoices: true } },
        invoices: {
          where:  { isDeleted: false },
          select: { _count: { select: { payments: { where: { status: "SUCCESS", isDeleted: false } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects", error: err.message });
  }
});

/* ── GET single project ── */
router.get("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  const clientScope = req.user.role === "CLIENT" ? { clientId: req.user.clientId } : {};
  try {
    const project = await prisma.project.findFirst({
      where:   { id, tenantId, ...clientScope },
      include: {
        client: { select: { id: true, name: true } },
        invoices: {
          where:   { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: {
            payments: {
              where:  { isDeleted: false, status: "SUCCESS" },
              select: { id: true, amount: true, method: true, paidAt: true },
            },
          },
        },
      },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Resolve project manager name
    let projectManagerName = null;
    if (project.projectManagerId) {
      const mgr = await prisma.user.findFirst({
        where:  { id: project.projectManagerId, tenantId },
        select: { name: true },
      });
      projectManagerName = mgr?.name ?? null;
    }

    res.json({ ...project, projectManagerName });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project", error: err.message });
  }
});

/* ── POST create project ── */
router.post("/", async (req, res) => {
  const { tenantId } = req.params;
  const { name, clientId, code, description, status, priority, type, budget, startDate, endDate, projectManagerId, createdBy } = req.body;

  if (!name || !clientId)
    return res.status(400).json({ message: "name and clientId are required" });

  try {
    const project = await prisma.project.create({
      data: {
        tenantId, name, clientId, code, description, status, priority, type,
        budget: Number(budget || 0),
        startDate: startDate ? new Date(startDate) : null,
        endDate:   endDate   ? new Date(endDate)   : null,
        projectManagerId, createdBy,
      },
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Failed to create project", error: err.message });
  }
});

/* ── PUT update project (also used to disable via status=CANCELLED) ── */
router.put("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  const { name, code, description, status, priority, type, budget, spent, startDate, endDate, projectManagerId } = req.body;

  try {
    const existing = await prisma.project.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Project not found" });

    const project = await prisma.project.update({
      where: { id },
      data:  {
        name, code, description, status, priority, type,
        budget: budget !== undefined ? Number(budget) : undefined,
        spent:  spent  !== undefined ? Number(spent)  : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate:   endDate   ? new Date(endDate)   : undefined,
        projectManagerId,
        updatedAt: new Date(),
      },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Failed to update project", error: err.message });
  }
});

/* ── DELETE project — only when no invoices exist
       Once invoices are generated, set status=CANCELLED to disable instead. ── */
router.delete("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  try {
    const project = await prisma.project.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { invoices: true } } },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project._count.invoices > 0) {
      return res.status(409).json({
        message:
          "Project has existing invoices and cannot be deleted. " +
          "Disable the project instead.",
      });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete project", error: err.message });
  }
});

module.exports = router;
