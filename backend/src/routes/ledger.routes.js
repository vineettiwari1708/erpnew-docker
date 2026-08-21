const express = require("express");
const prisma  = require("../config/db");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  const { type } = req.query;

  try {
    const entries = await prisma.ledger.findMany({
      where: {
        tenantId,
        ...(type && { type }),
        ...(req.user.role === "CLIENT" && {
          invoice: { is: { clientId: req.user.clientId } },
        }),
      },
      include: {
        invoice: { select: { id: true, invoiceNumber: true } },
        payment: { select: { id: true, method: true } },
        user:    { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ledger", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { tenantId, id } = req.params;
  try {
    const entry = await prisma.ledger.findFirst({
      where:   { id, tenantId },
      include: {
        invoice: true,
        payment: true,
        user:    { select: { id: true, name: true } },
      },
    });
    if (!entry) return res.status(404).json({ message: "Ledger entry not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ledger entry", error: err.message });
  }
});

module.exports = router;
