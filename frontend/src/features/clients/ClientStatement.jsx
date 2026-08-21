import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import toast from "react-hot-toast";

import { getClientStatementApi } from "../../services/api/client.api";
import { useTenantPath, useTenantProfile } from "../../store/hooks";
import StatementPDF from "../../pdf/StatementPDF";
import { fmtDate } from "../../utils/formatDate";

const STATUS_COLORS = {
  PAID:     "bg-green-100 text-green-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PENDING:  "bg-yellow-100 text-yellow-700",
  OVERDUE:  "bg-red-100 text-red-700",
  DRAFT:    "bg-slate-100 text-slate-600",
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function ClientStatement() {
  const tp = useTenantPath();
  const { id } = useParams();
  const tenantProfile = useTenantProfile();

  const [statement, setStatement] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!id) return;
    getClientStatementApi(id)
      .then((res) => setStatement(res.data))
      .catch(() => toast.error("Failed to load statement"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading statement...</p>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
        <p className="text-slate-600">Failed to load statement</p>
        <Link to={tp("/clients")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>
    );
  }

  const { client, invoices, summary } = statement;

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Account Statement</h1>
          <p className="text-sm text-slate-500">{client.name} — {client.company || client.email || "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          {statement && tenantProfile && (
            <PDFDownloadLink
              document={<StatementPDF tenant={tenantProfile} statement={statement} />}
              fileName={`statement-${client.name.replace(/\s+/g, "-")}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={pdfLoading}>
                  <Download size={15} />
                  {pdfLoading ? "Preparing..." : "Download PDF"}
                </button>
              )}
            </PDFDownloadLink>
          )}
          <Link to={tp(`/clients/${id}`)} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Total Billed"   value={fmt(summary.totalBilled)}   color="bg-slate-800 text-white" />
        <SummaryCard label="Total Paid"     value={fmt(summary.totalPaid)}     color="bg-green-600 text-white" />
        <SummaryCard label="Outstanding"    value={fmt(summary.outstanding)}   color={summary.outstanding > 0 ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"} />
        <SummaryCard label="Invoices"       value={summary.invoiceCount}       color="bg-indigo-50 text-indigo-700" />
        <SummaryCard label="Overdue"        value={summary.overdueCount}       color={summary.overdueCount > 0 ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"} />
      </div>

      {/* CLIENT INFO */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Client Details</h3>
        <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
          <div><span className="text-xs text-slate-400 block">Name</span>{client.name}</div>
          <div><span className="text-xs text-slate-400 block">Email</span>{client.email || "—"}</div>
          <div><span className="text-xs text-slate-400 block">Phone</span>{client.phone || "—"}</div>
          <div><span className="text-xs text-slate-400 block">Company</span>{client.company || "—"}</div>
        </div>
      </div>

      {/* INVOICE TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Invoice History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Invoice #</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Issue Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Due Date</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500">Billed</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500">Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500">Balance</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan="8" className="py-10 text-center text-slate-400">No invoices found</td></tr>
              ) : (
                invoices.map((inv) => {
                  const paid    = inv.payments.reduce((s, p) => s + p.amount, 0);
                  const balance = (inv.totalAmount || 0) - paid;
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{inv.invoiceNumber || inv.id}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.project?.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(inv.issueDate)}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{fmt(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmt(paid)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(balance)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[inv.status] || "bg-slate-100 text-slate-600"}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {invoices.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan="4" className="px-4 py-3 font-semibold text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(summary.totalBilled)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(summary.totalPaid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${summary.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(summary.outstanding)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${color}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
