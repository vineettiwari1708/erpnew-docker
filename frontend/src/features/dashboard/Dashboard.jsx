import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardApi } from "../../services/api/dashboard.api";
import { useAuth, useTenantPath, useHasPermission } from "../../store/hooks";

import SystemDashboard from "../system/SystemDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const tp = useTenantPath();

  /* ================= ROLE ================= */

  const isSuperAdmin = user?.role === "super_admin";

  const isClient = user?.role?.name === "CLIENT";

  const canViewProjects = useHasPermission("PROJECT_VIEW");
  const canCreateProject = useHasPermission("PROJECT_CREATE");
  const canCreateClient = useHasPermission("CLIENT_CREATE");
  const canViewUsers = useHasPermission("USER_MANAGE");
  const canViewClients = useHasPermission("CLIENT_VIEW");

  const tenantId = user?.tenantId;

  /* ================= STATE ================= */

  const [data, setData] = useState({
    totalProjects: 0,
    totalClients:  0,
    totalInvoices: 0,
    totalPayments: 0,
    totalUsers:    0,
    recentProjects: [],
    recentInvoices: [],
    recentPayments: [],
    revenue:        0,
    pendingAmount:  0,
  });

  const [loading, setLoading] = useState(true);

  /* ================= LOAD DASHBOARD ================= */

  useEffect(() => {
    if (!tenantId || isSuperAdmin) return;

    setLoading(true);
    getDashboardApi(tenantId)
      .then((res) => {
        const d = res.data || {};
        setData({
          totalProjects:  d.totalProjects  ?? 0,
          totalClients:   d.totalClients   ?? 0,
          totalInvoices:  d.totalInvoices  ?? 0,
          totalPayments:  d.totalPayments  ?? 0,
          totalUsers:     d.totalUsers     ?? 0,
          recentProjects: d.recentProjects ?? [],
          recentInvoices: d.recentInvoices ?? [],
          recentPayments: d.recentPayments ?? [],
          revenue:        d.revenue        ?? 0,
          pendingAmount:  d.pendingAmount  ?? 0,
        });
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, [tenantId, isSuperAdmin]);

  /* ================= SUPER ADMIN DASHBOARD ================= */

  if (isSuperAdmin) {
    return <SystemDashboard />;
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  /* ================= TENANT DASHBOARD ================= */

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500">
            Welcome back to Urbanfeat ERP SaaS
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canCreateProject && (
            <Link
              to={tp('/projects/create')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              + New Project
            </Link>
          )}

          {canCreateClient && (
            <Link
              to={tp('/clients/create')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              + Add Client
            </Link>
          )}
        </div>
      </div>

      {/* ================= STATS ================= */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {canViewProjects && (
          <Card
            title="Projects"
            value={data.totalProjects}
            to={tp('/projects')}
            color="indigo"
          />
        )}

        {canViewClients && (
          <Card
            title="Clients"
            value={data.totalClients}
            to={tp('/clients')}
            color="blue"
          />
        )}

        <Card
          title="Invoices"
          value={data.totalInvoices}
          to={tp(isClient ? '/invoices/client' : '/invoices')}
          color="green"
        />

        <Card
          title="Payments"
          value={data.totalPayments}
          to={tp(isClient ? '/payments/client' : '/payments')}
          color="amber"
        />

        {canViewUsers && (
          <Card
            title="Users"
            value={data.totalUsers}
            to={tp('/users')}
            color="purple"
          />
        )}
      </div>

      {/* ================= CONTENT ================= */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================= RECENT PROJECTS ================= */}

        {canViewProjects && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Recent Projects
              </h2>

              {!isClient && (
                <Link
                  to={tp('/projects')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View All
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {data.recentProjects.length > 0 ? (
                data.recentProjects
                  .map((project) => (
                    <Link
                      key={project.id}
                      to={tp(`/projects/${project.id}`)}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {project.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          #{project.code}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          project.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : project.status === "PLANNING"
                              ? "bg-amber-100 text-amber-700"
                              : project.status === "COMPLETED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {project.status}
                      </span>
                    </Link>
                  ))
              ) : (
                <div className="rounded-xl bg-slate-50 py-10 text-center">
                  <p className="text-sm text-slate-500">No projects found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= RECENT INVOICES ================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Recent Invoices
            </h2>

            <Link
              to={tp(isClient ? '/invoices/client' : '/invoices')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentInvoices.length > 0 ? (
              data.recentInvoices
                .map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString("en-IN")}
                      </p>

                      <p className="text-xs text-slate-400">
                        {invoice.invoiceNumber || `Invoice #${invoice.id}`}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        invoice.status === "PAID"     ? "bg-green-100 text-green-700"
                        : invoice.status === "APPROVED" ? "bg-blue-100 text-blue-700"
                        : invoice.status === "PENDING"  ? "bg-yellow-100 text-yellow-700"
                        : invoice.status === "OVERDUE"  ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                ))
            ) : (
              <div className="rounded-xl bg-slate-50 py-10 text-center">
                <p className="text-sm text-slate-500">No invoices found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= CARD ================= */

function Card({
  title,
  value,
  to,
  color = "indigo",
}) {
  const colors = {
    indigo:
      "from-indigo-500 to-indigo-600",
    blue: "from-blue-500 to-blue-600",
    green:
      "from-green-500 to-green-600",
    amber:
      "from-amber-500 to-amber-600",
    purple:
      "from-purple-500 to-purple-600",
  };

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div
        className={`inline-flex rounded-xl bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${colors[color]}`}
      >
        {title}
      </div>

      <h2 className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </h2>

      <p className="mt-1 text-sm text-slate-500 group-hover:text-slate-700">
        View {title.toLowerCase()}
      </p>
    </Link>
  );
}
