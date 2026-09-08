import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPaymentByIdApi } from "../../services/api/payment.api";
import { useTenantPath } from "../../store/hooks";
import { fmtDate as fmt } from "../../utils/formatDate";
import { fullClientName } from "../../utils/clientName";

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

export default function PaymentDetails() {
  const tp = useTenantPath();
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getPaymentByIdApi(id);
        setPayment(res.data || null);
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
        <p className="text-slate-500 animate-pulse">Loading payment...</p>
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

  const invoice = payment.invoice || null;
  const client  = payment.client  || null;

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Payment Details</h1>
          <p className="text-sm text-slate-500">Full payment information</p>
        </div>
        <Link to={tp("/payments")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      {/* HERO CARD */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">Payment</p>
            <h2 className="text-2xl font-bold text-slate-900 font-mono">{payment.paymentNumber || payment.id}</h2>
            {invoice && (
              <p className="text-sm text-slate-600 mt-1">
                Invoice: <span className="font-medium text-slate-800">{invoice.invoiceNumber || invoice.id}</span>
                {invoice.title && <span className="text-slate-400"> · {invoice.title}</span>}
              </p>
            )}
            {client && (
              <p className="text-sm text-slate-500 mt-0.5">Client: <span className="font-medium text-slate-700">{fullClientName(client)}</span></p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`fp px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[payment.status] || "bg-slate-100 text-slate-600"}`}>
              {payment.status}
            </span>
            <p className="text-2xl font-bold text-indigo-700">
              ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Invoice"        value={invoice?.invoiceNumber || payment.invoiceId} />
          <Info label="Client"         value={fullClientName(client) || payment.clientId} />
          <Info label="Amount"         value={`₹${Number(payment.amount || 0).toLocaleString("en-IN")}`} highlight />
          <Info label="Method"         value={METHOD_LABELS[payment.method] || payment.method} />
          <Info label="Transaction ID" value={payment.transactionId} />
          <Info label="Paid On"        value={fmt(payment.paidAt)} />
          <Info label="Status"         value={payment.status} />
          <Info label="Confirmed By"   value={payment.confirmedBy?.name || (payment.confirmedById ? "—" : undefined)} />
          <Info label="Created At"     value={fmt(payment.createdAt)} />
        </div>

        {/* NOTES */}
        {payment.notes && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Notes</p>
            <p className="text-sm text-slate-600 leading-relaxed">{payment.notes}</p>
          </div>
        )}

        {/* PROOF */}
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
    </section>
  );
}

function Info({ label, value, highlight }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3 hover:shadow-sm transition">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-indigo-600" : "text-slate-800"}`}>
        {value || "—"}
      </p>
    </div>
  );
}
