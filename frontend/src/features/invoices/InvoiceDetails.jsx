import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getInvoiceByIdApi } from "../../services/api/invoice.api";
import { useTenantPath } from "../../store/hooks";
import { fmtDate as fmt } from "../../utils/formatDate";

const STATUS_COLORS = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  OVERDUE:  "bg-red-100 text-red-700",
};

export default function InvoiceDetails() {
  const tp = useTenantPath();
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getInvoiceByIdApi(id);
        setInvoice(res.data || null);
      } catch (err) {
        console.error("Invoice Details Error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500">Invoice not found</p>
      </div>
    );
  }

  const client = invoice.client || null;

  const amount      = Number(invoice.amount      || 0);
  const tax         = Number(invoice.tax         || 0);
  const discount    = Number(invoice.discount    || 0);
  const totalAmount = Number(invoice.totalAmount || amount + tax - discount);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice Details</h1>
          <p className="text-sm text-slate-500">Full invoice information</p>
        </div>
        <Link to={tp("/invoices")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      {/* HERO CARD */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">Invoice</p>
            <h2 className="text-2xl font-bold text-slate-900">{invoice.invoiceNumber || invoice.id}</h2>
            {invoice.title && (
              <p className="text-sm text-slate-500 mt-1">{invoice.title}</p>
            )}
            <p className="text-sm text-slate-500 mt-0.5">
              Client: <span className="font-medium text-slate-700">{client?.name || invoice.clientId}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[invoice.status] || "bg-slate-100 text-slate-600"}`}>
              {invoice.status}
            </span>
            <p className="text-2xl font-bold text-indigo-700">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* AMOUNT BREAKDOWN */}
      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Amount Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Base Amount</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">₹{amount.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tax</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">₹{tax.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Discount</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">₹{discount.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Total</p>
            <p className="mt-1 text-sm font-bold text-indigo-700">₹{totalAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Invoice Number" value={invoice.invoiceNumber} />
          <Info label="Client"         value={client?.name || invoice.clientId} />
          <Info label="Project"        value={invoice.project?.name || invoice.projectId} />
          <Info label="Status"         value={invoice.status} />
          <Info label="Issue Date"     value={fmt(invoice.issueDate)} />
          <Info label="Due Date"       value={fmt(invoice.dueDate)} />
          <Info label="Created By"     value={invoice.createdByName} />
          <Info label="Approved By"    value={invoice.approvedByName} />
          <Info label="Paid At"        value={fmt(invoice.paidAt)} />
        </div>

        {/* NOTES */}
        <div className="pt-4 border-t">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Notes</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {invoice.notes || "No notes available"}
          </p>
        </div>

      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3 hover:shadow-sm transition">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value || "—"}</p>
    </div>
  );
}
