const express   = require("express");
const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const prisma    = require("../config/db");

if (!process.env.JWT_SECRET)
  throw new Error("JWT_SECRET environment variable is required");

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts — try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const systemUser = await prisma.systemUser.findUnique({ where: { email } });
    if (systemUser) {
      const valid = await bcrypt.compare(password, systemUser.passwordHash);
      if (!valid)
        return res.status(401).json({ message: "Invalid email or password" });

      const token = jwt.sign(
        { id: systemUser.id, tenantId: null, role: "super_admin", clientId: null, permissions: ["*"] },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      const { passwordHash, ...safeSystemUser } = systemUser;
      return res.json({
        user: { ...safeSystemUser, role: "super_admin", tenantId: null, permissions: ["*"] },
        token,
      });
    }

    const user = await prisma.user.findFirst({
      where:   { email, isDeleted: false },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (user.status !== "ACTIVE")
      return res.status(403).json({ message: "Account is inactive" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" });

    const permissions = user.role?.permissions.map((rp) => rp.permission.key) || [];

    const { passwordHash, ...safeUser } = user;

    const token = jwt.sign(
      { id: user.id, tenantId: user.tenantId, role: user.role?.name, clientId: user.clientId ?? null, permissions },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Fetch tenant and check it is active
    const tenantRec = await prisma.tenant.findUnique({
      where:  { id: user.tenantId },
      select: { slug: true, status: true, isDeleted: true },
    }).catch(() => null);

    if (!tenantRec || tenantRec.isDeleted || tenantRec.status !== "ACTIVE")
      return res.status(403).json({ message: "Company account is inactive or suspended" });

    res.json({ user: { ...safeUser, permissions, tenantSlug: tenantRec?.slug ?? null }, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;
