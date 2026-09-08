import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Download, FileText, Search, Send } from "lucide-react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";

import { getClientPaymentsApi } from "../../services/api/payment.api";
import PaymentPDF from "../../pdf/PaymentPDF";
import { useTenantPath, useAuth, useTenantProfile } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";

export default function ClientPayments() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const tenantId = user?.tenantId;
  // Admin passes ?clientId=clt_xxx from ClientDetails; CLIENT role uses their own id
  const clientId = searchParams.get("clientId") || user?.clientId;
  const isClientRole = user?.role === "CLIENT";

  const tenantProfile = useTenantProfile();
  const tenant = tenantProfile ?? {};

  const [payments, setPayments] = useState([]);
  const [previewPayment, setPreviewPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!tenantId || !clientId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const res = await getClientPaymentsApi(tenantId, clientId);
        setPayments(res.data || []);
      } catch (err) {
        console.error("Client Payment Load Error:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tenantId, clientId]);

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter((p) =>
      (p.paymentNumber          || "").toLowerCase().includes(q) ||
      (p.id                     || "").toLowerCase().includes(q) ||
      (p.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
      (p.invoiceId              || "").toLowerCase().includes(q) ||
      (p.method                 || "").toLowerCase().includes(q) ||
      (p.status                 || "").toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((a, b) => a + (b.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((a, b) => a + (b.amount || 0), 0);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Payments</h1>
          <p className="text-sm text-slate-500">View all payment transactions</p>
        </div>
        <div className="flex items-center gap-4">
          {isClientRole && (
            <Link
              to={tp("/payments/create")}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Send size={13} />
              Submit Payment
            </Link>
          )}
          <Link
            to={tp(isClientRole ? "/dashboard" : (clientId ? `/clients/${clientId}` : "/clients"))}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Payments" value={payments.length} />
        <Card title="Paid Amount"    value={`₹${totalPaid.toLocaleString("en-IN")}`} green />
        <Card title="Pending Amount" value={`₹${totalPending.toLocaleString("en-IN")}`} yellow />
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by payment ID, invoice or method..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left">Payment</th>
                  <th className="px-5 py-4 text-left">Invoice</th>
                  <th className="px-5 py-4 text-left">Amount</th>
                  <th className="px-5 py-4 text-left">Payment Info</th>
                  <th className="px-5 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="border-t hover:bg-slate-50">

                    <td
                      className="px-5 py-4 font-medium text-slate-800 cursor-default"
                      onMouseEnter={(e) => setTooltip({ pay, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={()  => setTooltip(null)}
                    >
                      <p className="whitespace-nowrap font-semibold text-indigo-600 underline decoration-dotted decoration-indigo-300">
                        {pay.paymentNumber || pay.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={tp(`/invoices/${pay.invoice?.invoiceNumber || pay.invoiceId}`)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline decoration-dotted decoration-indigo-300 whitespace-nowrap"
                      >
                        {pay.invoice?.invoiceNumber || pay.invoiceId || "—"}
                      </Link>
                      {pay.invoice?.title && (
                        <p className="text-xs mt-0.5 text-slate-400 truncate max-w-[140px]">{pay.invoice.title}</p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800">₹{Number(pay.amount || 0).toLocaleString("en-IN")}</span>
                        <StatusBadge status={pay.status} />
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap cursor-default">
                      <div className="group flex flex-col gap-0.5 transition-transform duration-200 hover:scale-[1.12] origin-left">
                        <span className="text-sm font-semibold text-slate-600 font-mono group-hover:text-slate-800 transition-colors duration-200">
                          {pay.transactionId || <span className="text-slate-300 font-sans font-normal">No ref</span>}
                          {pay.method && <span className="ml-1 font-sans font-semibold text-slate-400 group-hover:text-slate-600">({pay.method})</span>}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                          <span className="font-medium text-slate-500 group-hover:text-slate-700">Paid</span>{" "}
                          {pay.paidAt ? fmtDate(pay.paidAt) : "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        <Link
                          to={tp(`/payments/client/${pay.id}`)}
                          className="text-slate-600 hover:text-indigo-600 cursor-pointer"
                          title="View details"
                        >
                          <FileText size={18} />
                        </Link>

                        <button
                          onClick={() => setPreviewPayment(pay)}
                          className="text-slate-600 hover:text-black"
                          title="Preview PDF"
                        >
                          <Eye size={18} />
                        </button>

                        <PDFDownloadLink
                          document={<PaymentPDF tenant={tenant} payment={pay} />}
                          fileName={`payment-${pay.paymentNumber || pay.id}.pdf`}
                        >
                          {({ loading: pdfLoading }) =>
                            pdfLoading ? (
                              <span className="text-xs text-slate-400">...</span>
                            ) : (
                              <Download
                                size={18}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Download PDF"
                              />
                            )
                          }
                        </PDFDownloadLink>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAYMENT HOVER TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: Math.max(120, Math.min(tooltip.y, window.innerHeight - 120)), transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 ${
            tooltip.pay.status === "SUCCESS" ? "bg-emerald-600"
            : tooltip.pay.status === "PENDING" ? "bg-yellow-500"
            : "bg-red-500"
          }`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs font-bold text-white truncate">{tooltip.pay.paymentNumber || tooltip.pay.id}</p>
              <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                {tooltip.pay.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-white">
              ₹{Number(tooltip.pay.amount || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 space-y-2 text-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Invoice</p>
              <p className="mt-0.5 text-slate-700">{tooltip.pay.invoice?.invoiceNumber || tooltip.pay.invoiceId || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Method</p>
                <p className="mt-0.5 text-slate-700">{tooltip.pay.method || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Paid On</p>
                <p className="mt-0.5 text-slate-700">{fmtDate(tooltip.pay.paidAt) || "—"}</p>
              </div>
            </div>
            {tooltip.pay.transactionId && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Txn Ref</p>
                <p className="mt-0.5 font-mono text-slate-700">{tooltip.pay.transactionId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">
                Payment Preview — {previewPayment.paymentNumber || previewPayment.id}
              </h2>
              <button
                onClick={() => setPreviewPayment(null)}
                className="text-sm text-slate-600 hover:text-black"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-52px)]">
              <PDFViewer width="100%" height="100%">
                <PaymentPDF tenant={tenant} payment={previewPayment} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, value, green, yellow }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className={`mt-2 text-2xl font-bold ${
        green ? "text-green-600" : yellow ? "text-yellow-600" : "text-slate-800"
      }`}>
        {value}
      </h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    SUCCESS: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED:  "bg-red-100 text-red-700",
  };

  return (
    <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
