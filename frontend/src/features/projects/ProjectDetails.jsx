import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectByIdApi } from "../../services/api/project.api";
import { useTenantPath } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";
import { fullClientName } from "../../utils/clientName";

const STATUS_CLS = {
  ACTIVE:    "bg-green-100 text-green-700",
  PLANNING:  "bg-yellow-100 text-yellow-700",
  ON_HOLD:   "bg-orange-100 text-orange-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const INV_STATUS_CLS = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  OVERDUE:  "bg-red-100 text-red-700",
  DRAFT:    "bg-slate-100 text-slate-600",
};

export default function ProjectDetails() {
  const { id } = useParams();
  const tp = useTenantPath();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProjectByIdApi(id);
        setProject(res.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500">Project not found</p>
      </div>
    );
  }

  const invoices = project.invoices || [];
  const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
  const totalInvoiced = activeInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalPaid     = activeInvoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalPending  = activeInvoices
    .filter((i) => i.status === "PENDING" || i.status === "APPROVED")
    .reduce((s, i) => s + Number(i.totalAmount || 0), 0);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Project Details</h1>
          <p className="text-sm text-slate-500">Full project information</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={tp(`/projects/edit/${project.id}`)}
            className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
          >
            Edit
          </Link>
          <Link to={tp("/projects")} className="text-sm text-slate-500 hover:underline">← Back</Link>
        </div>
      </div>

      {/* HERO */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
            {project.code && (
              <p className="mt-1 text-xs font-mono text-slate-400">{project.code}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              Client: <span className="font-medium text-slate-700">{fullClientName(project.client) || "—"}</span>
            </p>
          </div>
          <span className={`fp px-3 py-1 text-xs font-semibold rounded-full ${STATUS_CLS[project.status] || "bg-slate-100 text-slate-600"}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* PROJECT INFO */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700">Project Info</h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Type"            value={project.type} />
          <Info label="Priority"        value={project.priority} />
          <Info label="Project Manager" value={project.projectManagerName} />
          <Info label="Client"          value={fullClientName(project.client)} />
          <Info label="Budget"          value={`₹${Number(project.budget || 0).toLocaleString("en-IN")}`} color="text-indigo-600" />
          <Info label="Spent"           value={`₹${Number(project.spent || 0).toLocaleString("en-IN")}`}  color="text-red-600" />
          <Info label="Start Date"      value={fmtDate(project.startDate)} />
          <Info label="End Date"        value={fmtDate(project.endDate)} />
        </div>

        {project.description && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Invoiced" value={`₹${totalInvoiced.toLocaleString("en-IN")}`} color="text-slate-800" />
        <StatCard label="Received"       value={`₹${totalPaid.toLocaleString("en-IN")}`}     color="text-green-600" />
        <StatCard label="Outstanding"    value={`₹${totalPending.toLocaleString("en-IN")}`}   color="text-yellow-600" />
      </div>

      {/* INVOICES + PAYMENTS */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-slate-800">
            Invoices &amp; Payments
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {invoices.length}
            </span>
          </h3>
          <Link
            to={tp(`/invoices/create?projectId=${project.id}&clientId=${project.client?.id || ""}`)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            + New Invoice
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No invoices yet for this project.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Paid On</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const pay = inv.payments?.[0] || null;
                  return (
                    <tr key={inv.id} className="border-t hover:bg-slate-50 transition-colors">

                      {/* INVOICE # */}
                      <td className="px-4 py-3">
                        <Link
                          to={tp(`/invoices/${inv.invoiceNumber || inv.id}`)}
                          className="text-sm font-semibold text-indigo-600 hover:underline whitespace-nowrap"
                        >
                          {inv.invoiceNumber || inv.id}
                        </Link>
                        {inv.title && (
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{inv.title}</p>
                        )}
                      </td>

                      {/* AMOUNT */}
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN")}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        <span className={`fp px-2.5 py-1 rounded-full text-xs font-semibold ${INV_STATUS_CLS[inv.status] || "bg-slate-100 text-slate-600"}`}>
                          {inv.status}
                        </span>
                      </td>

                      {/* DUE DATE */}
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {fmtDate(inv.dueDate) || "—"}
                      </td>

                      {/* PAYMENT METHOD */}
                      <td className="px-4 py-3">
                        {pay ? (
                          <span className="fp inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            ✓ {pay.method?.replace("_", " ")}
                          </span>
                        ) : inv.status === "PAID" ? (
                          <span className="text-xs text-green-600 font-medium">Paid</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* PAID DATE */}
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {pay?.paidAt ? fmtDate(pay.paidAt) : inv.paidAt ? fmtDate(inv.paidAt) : "—"}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
}

function Info({ label, value, color = "text-slate-800" }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${color}`}>{value || "—"}</p>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
