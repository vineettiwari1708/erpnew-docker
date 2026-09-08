import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { getInvoicesApi } from "../../services/api/invoice.api";
import { getTenantByIdApi } from "../../services/api/tenant.api";
import { fmtDate } from "../../utils/formatDate";
import { fullClientName } from "../../utils/clientName";

const STATUS_STYLE = {
  PAID:     "bg-green-100 text-green-700",
  PENDING:  "bg-yellow-100 text-yellow-700",
  OVERDUE:  "bg-red-100 text-red-700",
  CANCELLED:"bg-slate-100 text-slate-500",
};

export default function CompanyInvoices() {
  const { id } = useParams();
  const [invoices,   setInvoices]   = useState([]);
  const [tenantName, setTenantName] = useState("");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [invoiceRes, tenantRes] = await Promise.all([
          getInvoicesApi(id),
          getTenantByIdApi(id),
        ]);
        setInvoices(invoiceRes?.data || []);
        setTenantName(tenantRes?.data?.name || id);
      } catch {
        setTenantName(id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
  const totalPaid    = activeInvoices.filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalPending = activeInvoices.filter((i) => i.status === "PENDING")
    .reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalOverdue = activeInvoices.filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + Number(i.totalAmount || 0), 0);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {tenantName ? `${tenantName} — Invoices` : "Company Invoices"}
          </h1>
          <p className="text-sm text-slate-500">All invoices for this company</p>
        </div>
        <Link to={`/system/tenants/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← Back to Company
        </Link>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{invoices.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Paid</p>
          <p className="mt-2 text-2xl font-bold text-green-600">₹{fmt(totalPaid)}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">₹{fmt(totalPending)}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Overdue</p>
          <p className="mt-2 text-2xl font-bold text-red-600">₹{fmt(totalOverdue)}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    No invoices found for this company
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700">
                      {inv.invoiceNumber || inv.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {fullClientName(inv.client) || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {inv.project?.name || "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      ₹{fmt(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {inv.dueDate ? fmtDate(inv.dueDate) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[inv.status] || "bg-slate-100 text-slate-500"}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
