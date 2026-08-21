const express                      = require("express");
const prisma                       = require("../config/db");
const { upload, uploadToImageKit } = require("../middleware/upload.middleware");

const router = express.Router({ mergeParams: true });

const PROFILE_SELECT = {
  id: true, name: true, email: true, phone: true,
  address: true, logoUrl: true,
  gstNumber: true, gstEnabled: true, website: true,
};

router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  try {
    const tenant = await prisma.tenant.findUnique({
      where:  { id: tenantId },
      select: PROFILE_SELECT,
    });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

router.patch("/", upload.single("logo"), async (req, res) => {
  const { tenantId } = req.params;

  if (req.user?.role === "CLIENT")
    return res.status(403).json({ message: "Clients cannot update company profile" });

  try {
    const { name, email, phone, website, gstNumber, gstEnabled, address } = req.body;

    const data = {};
    if (name      !== undefined) data.name      = name;
    if (email     !== undefined) data.email     = email     || null;
    if (phone     !== undefined) data.phone     = phone     || null;
    if (website   !== undefined) data.website   = website   || null;
    if (gstNumber !== undefined) data.gstNumber = gstNumber || null;
    if (gstEnabled !== undefined) data.gstEnabled = gstEnabled === "true" || gstEnabled === true;
    if (address   !== undefined) {
      data.address = typeof address === "string" ? JSON.parse(address) : address;
    }

    if (req.file) {
      data.logoUrl = await uploadToImageKit(req.file);
    }

    data.updatedAt = new Date();

    const tenant = await prisma.tenant.update({
      where:  { id: tenantId },
      data,
      select: PROFILE_SELECT,
    });

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

module.exports = router;
