const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const morgan      = require("morgan");
const path        = require("path");
const prisma      = require("./config/db");

const authMiddleware   = require("./middleware/auth.middleware");
const tenantMiddleware = require("./middleware/tenant.middleware");
const errorMiddleware  = require("./middleware/error.middleware");

const authRoutes      = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes      = require("./routes/user.routes");
const clientRoutes    = require("./routes/client.routes");
const projectRoutes   = require("./routes/project.routes");
const invoiceRoutes   = require("./routes/invoice.routes");
const paymentRoutes   = require("./routes/payment.routes");
const ledgerRoutes    = require("./routes/ledger.routes");
const invoiceRequestRoutes = require("./routes/invoiceRequest.routes");
const roleRoutes      = require("./routes/role.routes");
const tenantRoutes    = require("./routes/tenant.routes");
const profileRoutes       = require("./routes/profile.routes");
const auditlogRoutes      = require("./routes/auditlog.routes");
const notificationRoutes  = require("./routes/notification.routes");
const systemRoutes        = require("./routes/system.routes");
const { metricsMiddleware, metricsEndpoint } = require("./middleware/metrics");

const app = express();

// Trust Render/Heroku/Nginx reverse proxy so rate-limiter reads the real client IP
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(metricsMiddleware);
app.get("/metrics", metricsEndpoint);

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => res.json({ status: "Vineet, Health is OK!" }));

/* ── SYSTEM routes must come BEFORE dynamic /api/:tenantId/* routes
   because Express matches /api/system/profile against /:tenantId/profile
   (tenantId = "system") if the static /api/system prefix is registered later ── */
app.use("/api/system/tenants",      authMiddleware, tenantRoutes);
app.use("/api/system",              authMiddleware, systemRoutes);

app.use("/api/:tenantId/dashboard",      authMiddleware, tenantMiddleware, dashboardRoutes);
app.use("/api/:tenantId/users",          authMiddleware, tenantMiddleware, userRoutes);
app.use("/api/:tenantId/clients",        authMiddleware, tenantMiddleware, clientRoutes);
app.use("/api/:tenantId/projects",       authMiddleware, tenantMiddleware, projectRoutes);
app.use("/api/:tenantId/invoices",       authMiddleware, tenantMiddleware, invoiceRoutes);
app.use("/api/:tenantId/payments",       authMiddleware, tenantMiddleware, paymentRoutes);
app.use("/api/:tenantId/ledger",         authMiddleware, tenantMiddleware, ledgerRoutes);
app.use("/api/:tenantId/invoice-requests", authMiddleware, tenantMiddleware, invoiceRequestRoutes);
app.use("/api/:tenantId/roles",          authMiddleware, tenantMiddleware, roleRoutes);
app.use("/api/:tenantId/profile",        authMiddleware, tenantMiddleware, profileRoutes);
app.use("/api/:tenantId/audit",          authMiddleware, tenantMiddleware, auditlogRoutes);
app.use("/api/:tenantId/notifications",  authMiddleware, tenantMiddleware, notificationRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
});
