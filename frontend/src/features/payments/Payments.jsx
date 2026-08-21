import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Download, FileText, Search, Trash2 } from "lucide-react";

import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";

import { getPaymentsApi, deletePaymentApi } from "../../services/api/payment.api";
import toast from "react-hot-toast";
import { useAuth, useTenantPath, useHasPermission, useTenantProfile } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";
import PaymentPDF from "../../pdf/PaymentPDF";

export default function Payments() {
  const { user } = useAuth();
  const tp = useTenantPath();
  const canCreate  = useHasPermission("PAYMENT_CREATE");
  const canEdit    = useHasPermission("PAYMENT_UPDATE");
  const canDelete  = useHasPermission("PAYMENT_DELETE");
  const tenantId = user?.tenantId;
  const tenantProfile = useTenantProfile();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPayment, setPreviewPayment] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { pay, x, y }
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  /* ================= FETCH PAYMENTS ================= */

  const fetchPayments = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);

      const res = await getPaymentsApi(tenantId);

      const tenantPayments = (res?.data || []).filter(
        (p) => p.tenantId === tenantId,
      );

      setPayments(tenantPayments);
    } catch (error) {
      console.error("Fetch payments error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [tenantId]);

  /* ================= PAGINATION LOGIC ================= */

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter((p) =>
      (p.paymentNumber          || "").toLowerCase().includes(q) ||
      (p.id                     || "").toLowerCase().includes(q) ||
      (p.invoiceId              || "").toLowerCase().includes(q) ||
      (p.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
      (p.invoice?.title         || "").toLowerCase().includes(q) ||
      (p.client?.name           || "").toLowerCase().includes(q) ||
      (p.method                 || "").toLowerCase().includes(q) ||
      (p.status                 || "").toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedPayments = filteredPayments.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deletePaymentApi(deleteTarget.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(`Payment "${deleteTarget.paymentNumber || deleteTarget.id.slice(0,8)}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <section className="h-[calc(95vh-80px)] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading payments...</p>
      </section>
    );
  }

  /* ================= UI ================= */

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">
      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>

          <p className="text-sm text-slate-500">
            Manage all tenant transactions
          </p>
        </div>

        {canCreate && (
          <Link
            to={tp('/payments/create')}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Record Payment
          </Link>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search by payment ID, invoice, client or method..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* ================= TABLE ================= */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            {/* HEAD */}
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Payment ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Txn Ref</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Paid On</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Action</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((pay) => (
                  <tr key={pay.id} className="border-b hover:bg-slate-50 transition-colors">
                    {/* PAYMENT REF — link to payment detail */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      <Link
                        to={tp(`/payments/${pay.paymentNumber || pay.id}`)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline decoration-dotted decoration-indigo-300"
                      >
                        {pay.paymentNumber || pay.id}
                      </Link>
                    </td>

                    {/* INVOICE — tooltip trigger + link to invoice detail */}
                    <td
                      className="px-4 py-3"
                      onMouseEnter={(e) => setTooltip({ pay, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={()  => setTooltip(null)}
                    >
                      <Link
                        to={tp(`/invoices/${pay.invoice?.invoiceNumber || pay.invoiceId}`)}
                        className="text-sm font-medium text-slate-800 hover:text-indigo-600 whitespace-nowrap underline decoration-dotted decoration-slate-400"
                      >
                        {pay.invoice?.invoiceNumber || pay.invoiceId}
                      </Link>
                      {pay.invoice?.title && (
                        <p className="text-xs text-slate-500 truncate max-w-[160px]">
                          {pay.invoice.title}
                        </p>
                      )}
                    </td>

                    {/* CLIENT */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {pay.client?.name || pay.clientId || "—"}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      ₹{Number(pay.amount || 0).toLocaleString("en-IN")}
                    </td>

                    {/* METHOD */}
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{pay.method || "—"}</td>

                    {/* TRANSACTION REF */}
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pay.transactionId || <span className="text-slate-300">—</span>}
                    </td>

                    {/* PAID ON */}
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {pay.paidAt
                        ? fmtDate(pay.paidAt)
                        : "—"}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          pay.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : pay.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-3 items-center">
                        <Link
                          to={tp(`/payments/${pay.paymentNumber || pay.id}`)}
                          className="text-slate-600 hover:text-indigo-600"
                          title="View Payment Details"
                        >
                          <FileText size={17} />
                        </Link>
                        {canEdit && (
                          <Link
                            to={tp(`/payments/edit/${pay.id}`)}
                            className="text-slate-600 hover:text-green-600"
                            title="Edit Payment"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </Link>
                        )}
                        {/* DELETE — only PENDING/REJECTED payments with no ledger entries */}
                        {canDelete &&
                          pay.status !== "SUCCESS" &&
                          (pay._count?.ledger ?? 0) === 0 && (
                          <button
                            onClick={() => setDeleteTarget(pay)}
                            className="text-slate-400 hover:text-red-600"
                            title="Delete Payment"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}

                        <Eye
                          size={17}
                          className="cursor-pointer text-slate-600 hover:text-black"
                          onClick={() => setPreviewPayment(pay)}
                        />

                        <PDFDownloadLink
                          document={<PaymentPDF tenant={tenantProfile ?? {}} payment={pay} />}
                          fileName={`payment-${pay.paymentNumber || pay.id}.pdf`}
                        >
                          {({ loading }) =>
                            loading ? (
                              <span className="text-xs text-slate-400">
                                ...
                              </span>
                            ) : (
                              <Download
                                size={17}
                                className="cursor-pointer text-indigo-600"
                              />
                            )
                          }
                        </PDFDownloadLink>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION CONTROLS ================= */}

      {payments.length > itemsPerPage && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Prev
            </button>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT HOVER TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: tooltip.y, transform: "translateY(-50%)" }}
        >
          {/* colour strip */}
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
            <p className="mt-0.5 text-xs text-white/70">
              ₹{Number(tooltip.pay.amount || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Invoice</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{tooltip.pay.invoice?.invoiceNumber || tooltip.pay.invoiceId || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{tooltip.pay.client?.name || tooltip.pay.clientId || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Method</p>
                <p className="mt-0.5 text-sm text-slate-700">{tooltip.pay.method || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Paid On</p>
                <p className="mt-0.5 text-xs text-slate-600">{tooltip.pay.paidAt ? fmtDate(tooltip.pay.paidAt) : "—"}</p>
              </div>
            </div>

            {tooltip.pay.transactionId && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Transaction Ref</p>
                <p className="mt-0.5 font-mono text-xs text-slate-700">{tooltip.pay.transactionId}</p>
              </div>
            )}

            {tooltip.pay.notes && (
              <p className="text-xs italic text-slate-400">{tooltip.pay.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Delete Payment?</h2>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{deleteTarget.invoice?.invoiceNumber || deleteTarget.invoiceId}</span>
                {" — "}₹{Number(deleteTarget.amount || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-sm text-red-600">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 border-t px-6 py-4">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PREVIEW MODAL ================= */}

      {previewPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="font-semibold text-sm">
                Payment Preview — {previewPayment.paymentNumber || previewPayment.id.slice(0, 8)}
              </h2>

              <button
                onClick={() => setPreviewPayment(null)}
                className="text-sm text-slate-600"
              >
                Close
              </button>
            </div>

            <PDFViewer width="100%" height="100%">
              <PaymentPDF payment={previewPayment} />
            </PDFViewer>
          </div>
        </div>
      )}
    </section>
  );
}
