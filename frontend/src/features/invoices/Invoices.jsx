import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Link } from "react-router-dom";
import { Eye, Download, FileText, Upload, FileText as FilePdf, Search, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  getInvoicesApi,
  approveInvoiceApi,
  confirmPaymentApi,
  deleteInvoiceApi,
} from "../../services/api/invoice.api";
import InvoicePDF from "../../pdf/InvoicePDF";
import { useTenantPath, useHasPermission, useTenantProfile } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";

export default function Invoices() {
  const tp = useTenantPath();
  const [invoices, setInvoices] = useState([]);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { inv, x, y }
  const [confirmForm, setConfirmForm] = useState({
    method: "CASH",
    transactionId: "",
    notes: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const proofInputRef = useRef(null);

  const tenantProfile = useTenantProfile();
  const tenant = tenantProfile ?? {};
  const user = useSelector((state) => state.auth.user);
  const tenantId = user?.tenantId;
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getInvoicesApi(tenantId);
        setInvoices(res.data || []);
      } catch (err) {
        console.error("Invoice Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tenantId]);

  const canCreate  = useHasPermission("INVOICE_CREATE");
  const canEdit    = useHasPermission("INVOICE_UPDATE");
  const canApprove = useHasPermission("INVOICE_APPROVE");
  const canDelete  = useHasPermission("INVOICE_DELETE");

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteInvoiceApi(deleteTarget.id);
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(`Invoice "${deleteTarget.invoiceNumber || deleteTarget.id}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function handleApprove(inv) {
    if (!window.confirm(`Approve invoice ${inv.invoiceNumber || inv.id}?`)) return;
    try {
      setActionLoading(true);
      const res = await approveInvoiceApi(inv.id);
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? res.data : i))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Approve failed");
    } finally {
      setActionLoading(false);
    }
  }

  function closeConfirmModal() {
    setConfirmModal(null);
    setConfirmForm({ method: "CASH", transactionId: "", notes: "" });
    setProofFile(null);
    setProofPreview(null);
  }

  function handleProofChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  function handleProofRemove() {
    setProofFile(null);
    setProofPreview(null);
    if (proofInputRef.current) proofInputRef.current.value = "";
  }

  async function handleConfirmPayment(e) {
    e.preventDefault();
    try {
      setActionLoading(true);
      const fd = new FormData();
      fd.append("method", confirmForm.method);
      if (confirmForm.transactionId) fd.append("transactionId", confirmForm.transactionId);
      if (confirmForm.notes)         fd.append("notes",         confirmForm.notes);
      if (proofFile)                 fd.append("proof",         proofFile);
      const res = await confirmPaymentApi(confirmModal.id, fd);
      setInvoices((prev) =>
        prev.map((i) => (i.id === confirmModal.id ? res.data.invoice : i))
      );
      closeConfirmModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Confirm payment failed");
    } finally {
      setActionLoading(false);
    }
  }

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter((i) =>
      (i.invoiceNumber || "").toLowerCase().includes(q) ||
      (i.title        || "").toLowerCase().includes(q) ||
      (i.clientId     || "").toLowerCase().includes(q) ||
      (i.status       || "").toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((a, b) => a + (b.totalAmount || b.amount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status === "PENDING")
    .reduce((a, b) => a + (b.totalAmount || b.amount || 0), 0);

  const totalApproved = invoices
    .filter((i) => i.status === "APPROVED")
    .reduce((a, b) => a + (b.totalAmount || b.amount || 0), 0);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Manage all tenant invoices</p>
        </div>

        {/* CREATE BUTTON — ADMIN and ACCOUNT only */}
        {canCreate && (
          <Link
            to={tp('/invoices/create')}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Create Invoice
          </Link>
        )}
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Total Invoices" value={invoices.length} />
        <Card title="Paid Amount" value={`₹${totalPaid.toLocaleString()}`} green />
        <Card title="Approved (Awaiting)" value={`₹${totalApproved.toLocaleString()}`} blue />
        <Card title="Pending Approval" value={`₹${totalPending.toLocaleString()}`} yellow />
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice #, title, client or status..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading invoices...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-slate-50 transition-colors">
                    {/* INVOICE NUMBER + TITLE — tooltip trigger + clickable link */}
                    <td
                      className="px-4 py-3"
                      onMouseEnter={(e) => setTooltip({ inv, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={()  => setTooltip(null)}
                    >
                      <Link
                        to={tp(`/invoices/${inv.invoiceNumber || inv.id}`)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap underline decoration-dotted decoration-indigo-300"
                      >
                        {inv.invoiceNumber || inv.id}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-[180px] truncate">{inv.title || "—"}</p>
                    </td>

                    {/* CLIENT */}
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{inv.client?.name || inv.clientId}</td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      ₹{(inv.totalAmount || inv.amount || 0).toLocaleString()}
                    </td>

                    {/* ISSUE DATE */}
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {inv.issueDate || inv.issuedDate
                        ? fmtDate(inv.issueDate || inv.issuedDate)
                        : "—"}
                    </td>

                    {/* DUE DATE */}
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {inv.dueDate
                        ? fmtDate(inv.dueDate)
                        : "—"}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">

                        {/* APPROVE — PENDING invoices, ADMIN/MANAGER only */}
                        {canApprove && inv.status === "PENDING" && (
                          <button
                            onClick={() => handleApprove(inv)}
                            disabled={actionLoading}
                            className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            title="Approve Invoice"
                          >
                            Approve
                          </button>
                        )}

                        {/* CONFIRM PAYMENT — APPROVED invoices, ADMIN/MANAGER only */}
                        {canApprove && inv.status === "APPROVED" && (
                          <button
                            onClick={() => setConfirmModal(inv)}
                            disabled={actionLoading}
                            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            title="Confirm Offline Payment"
                          >
                            Confirm Payment
                          </button>
                        )}

                        {/* VIEW */}
                        <Link
                          to={tp(`/invoices/${inv.invoiceNumber || inv.id}`)}
                          className="text-slate-600 hover:text-indigo-600"
                          title="View Invoice"
                        >
                          <FileText size={17} />
                        </Link>

                        {/* EDIT */}
                        {/* <Link
                          to={`/invoices/edit/${inv.id}`}
                          className="text-slate-600 hover:text-green-600"
                          title="Edit Invoice"
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
                        </Link> */}

                        {canEdit && (
                          <Link
                            to={tp(`/invoices/edit/${inv.id}`)}
                            className="text-slate-600 hover:text-green-600"
                            title="Edit Invoice"
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

                        {/* DELETE — only DRAFT/PENDING invoices with no payments or ledger entries */}
                        {canDelete &&
                          !["APPROVED", "PAID", "OVERDUE"].includes(inv.status) &&
                          (inv._count?.payments ?? 0) === 0 &&
                          (inv._count?.ledger   ?? 0) === 0 && (
                          <button
                            onClick={() => setDeleteTarget(inv)}
                            className="text-slate-400 hover:text-red-600"
                            title="Delete Invoice"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}

                        {/* PREVIEW */}
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="text-slate-600 hover:text-black"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>

                        {/* DOWNLOAD */}
                        <PDFDownloadLink
                          document={
                            <InvoicePDF tenant={tenant} invoice={inv} />
                          }
                          fileName={`invoice-${inv.id}.pdf`}
                        >
                          <Download
                            size={18}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Download PDF"
                          />
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

      {/* INVOICE HOVER TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: tooltip.y, transform: "translateY(-50%)" }}
        >
          {/* colour strip */}
          <div className="rounded-t-2xl bg-indigo-600 px-4 py-3">
            <p className="font-mono text-sm font-bold text-white">{tooltip.inv.invoiceNumber || tooltip.inv.id}</p>
            {tooltip.inv.title && (
              <p className="mt-0.5 text-xs text-indigo-200 truncate">{tooltip.inv.title}</p>
            )}
          </div>

          <div className="p-4 space-y-3">
            {/* client + project */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{tooltip.inv.client?.name || tooltip.inv.clientId || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Project</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{tooltip.inv.project?.name || "—"}</p>
              </div>
            </div>

            {/* dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Issue Date</p>
                <p className="mt-0.5 text-xs text-slate-600">{fmtDate(tooltip.inv.issueDate) || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due Date</p>
                <p className="mt-0.5 text-xs text-slate-600">{fmtDate(tooltip.inv.dueDate) || "—"}</p>
              </div>
            </div>

            {/* amount breakdown */}
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Base Amount</span>
                <span>₹{Number(tooltip.inv.amount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>₹{Number(tooltip.inv.tax || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>−₹{Number(tooltip.inv.discount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-800">
                <span>Total</span>
                <span className="text-indigo-600">₹{Number(tooltip.inv.totalAmount || tooltip.inv.amount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* status + notes */}
            <div className="flex items-center gap-2">
              <StatusBadge status={tooltip.inv.status} />
              {tooltip.inv.notes && (
                <p className="text-xs italic text-slate-400 truncate">{tooltip.inv.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PAYMENT MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Confirm Offline Payment — {confirmModal.invoiceNumber || confirmModal.id}
              </h2>
              <button
                onClick={closeConfirmModal}
                className="text-sm text-slate-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 p-5">
              <div>
                <p className="mb-3 text-sm text-slate-600">
                  Amount: <span className="font-semibold text-slate-900">₹{(confirmModal.totalAmount || confirmModal.amount || 0).toLocaleString()}</span>
                  &nbsp;· Client: <span className="font-semibold text-slate-900">{confirmModal.client?.name || confirmModal.clientId}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={confirmForm.method}
                  onChange={(e) =>
                    setConfirmForm((f) => ({ ...f, method: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Transaction / Reference ID <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={confirmForm.transactionId}
                  onChange={(e) =>
                    setConfirmForm((f) => ({ ...f, transactionId: e.target.value }))
                  }
                  placeholder="e.g. UTR123456789"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={confirmForm.notes}
                  onChange={(e) =>
                    setConfirmForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Payment confirmation details..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* PAYMENT PROOF UPLOAD */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Proof <span className="text-slate-400 font-normal">(JPG, PNG, PDF — optional)</span>
                </label>

                {proofPreview ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="shrink-0">
                      {proofFile?.type === "application/pdf" ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                          <FilePdf size={20} className="text-red-500" />
                        </div>
                      ) : (
                        <img
                          src={proofPreview}
                          alt="Proof"
                          className="h-12 w-12 rounded-lg border object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{proofFile?.name}</p>
                      <p className="text-xs text-slate-500">{proofFile ? (proofFile.size / 1024).toFixed(1) + " KB" : ""}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => proofInputRef.current?.click()}
                        className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                        Replace
                      </button>
                      <button type="button" onClick={handleProofRemove}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 py-4 text-slate-400 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Upload size={20} />
                    <span className="text-xs">Click to upload payment proof</span>
                  </button>
                )}

                <input
                  ref={proofInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={handleProofChange}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? "Confirming..." : "Confirm Payment"}
                </button>
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
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
              <h2 className="text-base font-semibold text-slate-800">Delete Invoice?</h2>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{deleteTarget.invoiceNumber || deleteTarget.id}</span>
                {deleteTarget.title ? ` — ${deleteTarget.title}` : ""}
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

      {/* PDF PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">
                Invoice Preview — {previewInvoice.invoiceNumber || previewInvoice.id.slice(0, 8)}
              </h2>

              <button
                onClick={() => setPreviewInvoice(null)}
                className="text-sm text-slate-600 hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="h-[calc(100%-60px)]">
              <PDFViewer width="100%" height="100%">
                <InvoicePDF tenant={tenant} invoice={previewInvoice} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, value, green, yellow, blue }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h2
        className={`mt-2 text-2xl font-bold ${
          green
            ? "text-green-600"
            : blue
              ? "text-blue-600"
              : yellow
                ? "text-yellow-600"
                : "text-slate-800"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PAID: "bg-green-100 text-green-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    OVERDUE: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
