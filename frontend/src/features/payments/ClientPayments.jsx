import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Download, FileText, Search } from "lucide-react";
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
      (p.id        || "").toLowerCase().includes(q) ||
      (p.invoiceId || "").toLowerCase().includes(q) ||
      (p.method    || "").toLowerCase().includes(q) ||
      (p.status    || "").toLowerCase().includes(q)
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
        <Link
          to={tp(clientId ? `/clients/${clientId}` : "/clients")}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back
        </Link>
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
            <table className="min-w-[660px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left">Payment ID</th>
                  <th className="px-5 py-4 text-left">Invoice</th>
                  <th className="px-5 py-4 text-left">Amount</th>
                  <th className="px-5 py-4 text-left">Method</th>
                  <th className="px-5 py-4 text-left">Paid On</th>
                  <th className="px-5 py-4 text-left">Status</th>
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
                      <p className="whitespace-nowrap underline decoration-dotted decoration-slate-400">{pay.id}</p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">{pay.invoice?.invoiceNumber || pay.invoiceId || "—"}</td>

                    <td className="px-5 py-4 font-medium">
                      ₹{Number(pay.amount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 text-slate-600">{pay.method || "—"}</td>

                    <td className="px-5 py-4 text-slate-600">
                      {fmtDate(pay.paidAt)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={pay.status} />
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
                          fileName={`payment-${pay.id}.pdf`}
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
          style={{ left: tooltip.x + 14, top: tooltip.y, transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 ${
            tooltip.pay.status === "SUCCESS" ? "bg-emerald-600"
            : tooltip.pay.status === "PENDING" ? "bg-yellow-500"
            : "bg-red-500"
          }`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs font-bold text-white truncate">{tooltip.pay.id}</p>
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
                Payment Preview — {previewPayment.id}
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
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
