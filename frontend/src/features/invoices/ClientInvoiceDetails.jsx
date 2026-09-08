import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { ArrowLeft, Download, Eye, X } from "lucide-react";

import { getClientInvoiceByIdApi } from "../../services/api/invoice.api";
import InvoicePDF from "../../pdf/InvoicePDF";
import { useTenantPath, useAuth, useTenantProfile } from "../../store/hooks";
import { fmtDate as fmt } from "../../utils/formatDate";

const STATUS_COLORS = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  OVERDUE:  "bg-red-100 text-red-700",
};

export default function ClientInvoiceDetails() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const tenantProfile = useTenantProfile();
  const tenant = tenantProfile ?? {};
  const { id } = useParams();

  const tenantId = user?.tenantId;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!id || !tenantId) return;

    async function load() {
      try {
        setLoading(true);
        const res = await getClientInvoiceByIdApi(tenantId, id);
        setInvoice(res?.data || null);
      } catch (err) {
        console.error("Invoice Details Error:", err);
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, tenantId]);

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

  const amount      = Number(invoice.amount      || 0);
  const tax         = Number(invoice.tax         || 0);
  const discount    = Number(invoice.discount    || 0);
  const totalAmount = Number(invoice.totalAmount || amount + tax - discount);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <Link
            to={tp("/invoices/client")}
            className="rounded-lg border p-2 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Invoice Details</h1>
            <p className="text-sm text-slate-500">Invoice ID: {invoice.id}</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            <Eye size={16} />
            Preview
          </button>

          <PDFDownloadLink
            document={<InvoicePDF tenant={tenant} invoice={invoice} />}
            fileName={`invoice-${invoice.id}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <button
                disabled={pdfLoading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Download size={16} />
                {pdfLoading ? "Preparing..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </div>

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
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`fp px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[invoice.status] || "bg-slate-100 text-slate-600"}`}>
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
      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Invoice Number" value={invoice.invoiceNumber} />
          <Info label="Status"         value={invoice.status} />
          <Info label="Issue Date"     value={fmt(invoice.issueDate)} />
          <Info label="Due Date"       value={fmt(invoice.dueDate)} />
          <Info label="Approved By"    value={invoice.approvedByName} />
          <Info label="Paid At"        value={fmt(invoice.paidAt)} />
        </div>

        {invoice.notes && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Notes</p>
            <p className="text-sm text-slate-600 leading-relaxed">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* ITEMS TABLE */}
      {invoice.items?.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-slate-800">Invoice Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[500px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left">Item</th>
                  <th className="px-5 py-4 text-left">Qty</th>
                  <th className="px-5 py-4 text-left">Price</th>
                  <th className="px-5 py-4 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-5 py-4">{item.name}</td>
                    <td className="px-5 py-4">{item.quantity}</td>
                    <td className="px-5 py-4">₹{Number(item.price || 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 font-medium">₹{(item.quantity * item.price).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">
                Invoice Preview — {invoice.invoiceNumber || invoice.id}
              </h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <PDFViewer width="100%" height="100%">
                <InvoicePDF tenant={tenant} invoice={invoice} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

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
