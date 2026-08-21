import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { ArrowLeft, Download, Eye, X } from "lucide-react";

import { getClientPaymentByIdApi } from "../../services/api/payment.api";
import PaymentPDF from "../../pdf/PaymentPDF";
import { useTenantPath, useAuth, useTenantProfile } from "../../store/hooks";
import { fmtDate as fmt } from "../../utils/formatDate";

const STATUS_COLORS = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED:  "bg-red-100 text-red-700",
};

const METHOD_LABELS = {
  CASH:          "Cash",
  UPI:           "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD:          "Card",
  CHEQUE:        "Cheque",
};

export default function ClientPaymentDetails() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const tenantProfile = useTenantProfile();
  const tenant = tenantProfile ?? {};
  const { id } = useParams();

  const tenantId = user?.tenantId;

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!id || !tenantId) return;

    async function load() {
      try {
        setLoading(true);
        const res = await getClientPaymentByIdApi(tenantId, id);
        setPayment(res?.data || null);
      } catch (err) {
        console.error("Payment Details Error:", err);
        setPayment(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, tenantId]);

  if (loading) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading payment details...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500">Payment not found</p>
      </div>
    );
  }

  const amount = Number(payment.amount || 0);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={tp("/payments/client")}
            className="rounded-lg border p-2 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Payment Details</h1>
            <p className="text-sm text-slate-500">Payment ID: {payment.id}</p>
          </div>
        </div>

        {/* PDF ACTIONS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            <Eye size={16} />
            Preview
          </button>

          <PDFDownloadLink
            document={<PaymentPDF tenant={tenant} payment={payment} />}
            fileName={`payment-${payment.id}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <button
                disabled={pdfLoading}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Download size={16} />
                {pdfLoading ? "Preparing..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* HERO CARD */}
      <div className="rounded-2xl border bg-gradient-to-r from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-1">Payment</p>
            <h2 className="text-2xl font-bold text-slate-900">{payment.id}</h2>
            {payment.invoiceId && (
              <p className="text-sm text-slate-600 mt-1">
                Invoice:{" "}
                <span className="font-medium text-slate-800">
                  {payment.invoice?.invoiceNumber || payment.invoiceId}
                </span>
              </p>
            )}
            {payment.invoice?.title && (
              <p className="text-sm text-slate-400 mt-0.5">{payment.invoice.title}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[payment.status] || "bg-slate-100 text-slate-600"}`}>
              {payment.status}
            </span>
            <p className="text-2xl font-bold text-emerald-700">
              ₹{amount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Payment ID"     value={payment.id} mono />
          <Info label="Invoice"        value={payment.invoice?.invoiceNumber || payment.invoiceId} />
          <Info label="Amount"         value={`₹${amount.toLocaleString("en-IN")}`} highlight />
          <Info label="Method"         value={METHOD_LABELS[payment.method] || payment.method} />
          <Info label="Transaction ID" value={payment.transactionId} mono />
          <Info label="Status"         value={payment.status} />
          <Info label="Paid On"        value={fmt(payment.paidAt)} />
          <Info label="Created At"     value={fmt(payment.createdAt)} />
        </div>

        {payment.notes && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Notes</p>
            <p className="text-sm text-slate-600 leading-relaxed">{payment.notes}</p>
          </div>
        )}

        {payment.proofUrl && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Payment Proof</p>
            <img
              src={payment.proofUrl}
              alt="Payment Proof"
              className="w-full max-w-md rounded-xl border"
            />
          </div>
        )}
      </div>

      {/* PDF PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Payment Preview — {payment.id}</h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <PDFViewer width="100%" height="100%">
                <PaymentPDF tenant={tenant} payment={payment} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function Info({ label, value, highlight, mono }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3 hover:shadow-sm transition">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold truncate ${highlight ? "text-emerald-600" : "text-slate-800"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}
