import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { getInvoicesApi } from "../../services/api/invoice.api";
import { getPaymentsApi } from "../../services/api/payment.api";
import { useAuth, useTenantPath } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";

export default function Ledger() {
  const { user } = useAuth();
  const tp = useTenantPath();

  const tenantId = user?.tenantId;

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([getInvoicesApi(tenantId), getPaymentsApi(tenantId)])
      .then(([invRes, payRes]) => {
        setInvoices(invRes?.data || []);
        setPayments((payRes?.data || []).filter((p) => p.status === "SUCCESS"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  const ledger = useMemo(() => {
    const invoiceEntries = invoices.map((i) => ({
      id: `inv_led_${i.id}`,
      entryKind: "INVOICE",
      type: "RECEIVABLE",
      amount: Number(i.totalAmount || i.amount || 0),
      referenceId: i.id,
      displayRef: i.invoiceNumber || i.id,
      description: `${i.invoiceNumber || i.id} — ${i.title || "Invoice"}`,
      status: i.status,
      voided: i.status === "CANCELLED",
      createdAt: i.createdAt,
    }));

    const paymentEntries = payments.map((p) => ({
      id: `pay_led_${p.id}`,
      entryKind: "PAYMENT",
      type: "CREDIT",
      amount: Number(p.amount || 0),
      referenceId: p.id,
      displayRef: p.paymentNumber || p.id,
      description: `Payment — ${p.invoice?.invoiceNumber || p.invoice?.title || "Invoice"}`,
      status: "SUCCESS",
      voided: false,
      createdAt: p.createdAt,
    }));

    return [...invoiceEntries, ...paymentEntries].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [invoices, payments]);

  const stats = useMemo(() => {
    // Exclude CANCELLED (voided) invoices from all calculations
    const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalOutstanding = activeInvoices
      .filter((i) => i.status === "PENDING" || i.status === "APPROVED" || i.status === "OVERDUE")
      .reduce((sum, i) => sum + Number(i.totalAmount || i.amount || 0), 0);
    const totalInvoiced = activeInvoices.reduce(
      (sum, i) => sum + Number(i.totalAmount || i.amount || 0),
      0
    );
    const activeEntries = ledger.filter((e) => !e.voided);
    return {
      total: activeEntries.length,
      totalReceived,
      totalOutstanding,
      balance: totalInvoiced - totalReceived,
    };
  }, [ledger, invoices, payments]);

  const filteredLedger = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ledger;
    return ledger.filter((e) =>
      (e.description  || "").toLowerCase().includes(q) ||
      (e.referenceId  || "").toLowerCase().includes(q) ||
      (e.entryKind    || "").toLowerCase().includes(q) ||
      (e.type         || "").toLowerCase().includes(q) ||
      (e.status       || "").toLowerCase().includes(q)
    );
  }, [ledger, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLedger.length / PAGE_SIZE));
  const paginated = filteredLedger.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading ledger...</p>
      </div>
    );
  }

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="rounded-xl border bg-gradient-to-r from-indigo-50 to-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">
          Invoice &amp; payment history — read only, auto-updated
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Total Entries" value={stats.total} />
        <Card title="Received" value={`₹${stats.totalReceived.toLocaleString("en-IN")}`} color="text-green-600" />
        <Card title="Outstanding" value={`₹${stats.totalOutstanding.toLocaleString("en-IN")}`} color="text-yellow-600" />
        <Card
          title="Balance"
          value={`${stats.balance >= 0 ? "+" : "-"}₹${Math.abs(stats.balance).toLocaleString("en-IN")}`}
          color={stats.balance >= 0 ? "text-green-600" : "text-red-600"}
        />
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by description, reference, type or status..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">

        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-slate-800">Transaction History</h2>
          <span className="fp text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">Read Only</span>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No entries found for this tenant.
          </div>
        ) : (
          <div className="divide-y">
            {paginated.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 p-4 transition-colors cursor-default ${
                  item.voided ? "bg-red-50/30 opacity-60" : "hover:bg-slate-50"
                }`}
                onMouseEnter={(e) => setTooltip({ item, x: e.clientX, y: e.clientY })}
                onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={()  => setTooltip(null)}
              >
                {/* LEFT */}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <Link
                    to={
                      item.entryKind === "INVOICE"
                        ? tp(`/invoices/${item.referenceId}`)
                        : tp(`/payments/${item.referenceId}`)
                    }
                    className={`text-sm font-medium truncate ${
                      item.voided
                        ? "line-through text-slate-400"
                        : "text-slate-800 hover:text-indigo-600"
                    }`}
                  >
                    {item.description}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {item.entryKind === "INVOICE" ? "Invoice" : "Payment"}
                    {" · "}
                    {item.displayRef}
                    {" · "}
                    {fmtDate(item.createdAt)}
                  </p>
                </div>

                {/* STATUS */}
                <StatusBadge type={item.type} status={item.status} voided={item.voided} />

                {/* AMOUNT */}
                <p className={`text-sm font-semibold whitespace-nowrap ${
                  item.voided
                    ? "line-through text-slate-400"
                    : item.type === "CREDIT"
                      ? "text-green-600"
                      : "text-yellow-600"
                }`}>
                  {item.type === "CREDIT" ? "+" : "~"}₹{Number(item.amount).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {ledger.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, ledger.length)} of {ledger.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, idx) =>
                  n === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                        page === n
                          ? "bg-indigo-600 text-white"
                          : "border text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* LEDGER HOVER TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-68 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: Math.max(130, Math.min(tooltip.y, window.innerHeight - 130)), transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 ${
            tooltip.item.voided
              ? "bg-slate-400"
              : tooltip.item.entryKind === "PAYMENT"
              ? "bg-emerald-600"
              : "bg-indigo-600"
          }`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {tooltip.item.entryKind === "PAYMENT" ? "Payment" : "Invoice"}
              </p>
              {tooltip.item.voided && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Voided
                </span>
              )}
            </div>
            <p className={`text-sm font-bold truncate ${tooltip.item.voided ? "line-through text-white/70" : "text-white"}`}>
              {tooltip.item.description}
            </p>
          </div>
          <div className="p-4 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reference</p>
                <p className="mt-0.5 font-mono text-slate-700 truncate">{tooltip.item.displayRef}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Type</p>
                <p className={`mt-0.5 font-semibold ${tooltip.item.type === "CREDIT" ? "text-emerald-600" : "text-yellow-600"}`}>
                  {tooltip.item.type === "CREDIT" ? "CREDIT" : "RECEIVABLE"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount</p>
                <p className={`mt-0.5 font-bold ${tooltip.item.type === "CREDIT" ? "text-emerald-600" : "text-yellow-600"}`}>
                  {tooltip.item.type === "CREDIT" ? "+" : "~"}₹{Number(tooltip.item.amount).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                <p className="mt-0.5 text-slate-700">{fmtDate(tooltip.item.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ type, status, voided }) {
  if (voided) {
    return (
      <span className="fp px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-400 line-through whitespace-nowrap">
        VOIDED
      </span>
    );
  }

  if (type === "CREDIT") {
    return (
      <span className="fp px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 whitespace-nowrap">
        RECEIVED
      </span>
    );
  }

  const styles = {
    PENDING:  "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PAID:     "bg-green-100 text-green-700",
    OVERDUE:  "bg-red-100 text-red-700",
    DRAFT:    "bg-slate-100 text-slate-500",
  };

  return (
    <span className={`fp px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status || "UNKNOWN"}
    </span>
  );
}

function Card({ title, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
      <h2 className={`text-xl font-semibold mt-1 ${color}`}>{value}</h2>
    </div>
  );
}
