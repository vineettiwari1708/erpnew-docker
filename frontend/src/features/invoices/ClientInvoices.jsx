import { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Download, FileText, Search, Send, X, Inbox } from "lucide-react";
import toast from "react-hot-toast";

import { getClientInvoicesApi } from "../../services/api/invoice.api";
import { getProjectsApi } from "../../services/api/project.api";
import { getInvoiceRequestsApi, createInvoiceRequestApi } from "../../services/api/invoiceRequest.api";
import InvoicePDF from "../../pdf/InvoicePDF";
import { useTenantPath, useAuth, useTenantProfile } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";

export default function ClientInvoices() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const tenantId = user?.tenantId;
  // Admin passes ?clientId=clt_xxx from ClientDetails; CLIENT role uses their own id
  const clientId = searchParams.get("clientId") || user?.clientId;

  const tenantProfile = useTenantProfile();
  const tenant = tenantProfile ?? {};

  const [invoices, setInvoices] = useState([]);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [search, setSearch] = useState("");

  const isClientRole = user?.role === "CLIENT";
  const [myRequests, setMyRequests] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ projectId: "", title: "", notes: "" });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!tenantId || !clientId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const res = await getClientInvoicesApi(tenantId, clientId);
        setInvoices(res.data || []);
      } catch (err) {
        console.error("Client Invoice Load Error:", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tenantId, clientId]);

  /* ── LOAD MY REQUESTS + MY PROJECTS (CLIENT role only) ── */
  const loadRequests = () => {
    getInvoiceRequestsApi().then((res) => setMyRequests(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (!isClientRole || !tenantId) return;
    loadRequests();
    getProjectsApi(tenantId)
      .then((res) => setMyProjects((res.data || []).filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED")))
      .catch(() => setMyProjects([]));
  }, [isClientRole, tenantId]);

  const submitRequest = async () => {
    const title = requestForm.title.trim();
    if (title.length < 3) { toast.error("Please describe what the invoice is for (min 3 characters)"); return; }
    setSubmittingRequest(true);
    try {
      await createInvoiceRequestApi({ projectId: requestForm.projectId || null, title, notes: requestForm.notes.trim() });
      toast.success("Invoice request sent");
      setShowRequestModal(false);
      setRequestForm({ projectId: "", title: "", notes: "" });
      loadRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter((i) =>
      (i.invoiceNumber || "").toLowerCase().includes(q) ||
      (i.title         || "").toLowerCase().includes(q) ||
      (i.status        || "").toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((a, b) => a + (b.totalAmount || b.amount || 0), 0);

  const totalApproved = invoices
    .filter((i) => i.status === "APPROVED")
    .reduce((a, b) => a + (b.totalAmount || b.amount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status === "PENDING")
    .reduce((a, b) => a + (b.totalAmount || b.amount || 0), 0);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Invoices</h1>
          <p className="text-sm text-slate-500">View and download your invoices</p>
        </div>
        <div className="flex items-center gap-4">
          {isClientRole && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Send size={13} />
              Request Invoice
            </button>
          )}
          <Link
            to={tp(isClientRole ? "/dashboard" : (clientId ? `/clients/${clientId}` : "/clients"))}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* MY REQUESTS */}
      {isClientRole && myRequests.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Inbox size={15} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-800">My Invoice Requests</h2>
          </div>
          <div className="space-y-2">
            {myRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{r.title}</p>
                  {r.status === "DECLINED" && r.declineReason && (
                    <p className="truncate text-xs italic text-red-400">Reason: {r.declineReason}</p>
                  )}
                </div>
                <RequestStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Total Invoices" value={invoices.length} />
        <Card title="Paid"           value={`₹${totalPaid.toLocaleString("en-IN")}`} green />
        <Card title="Awaiting Payment" value={`₹${totalApproved.toLocaleString("en-IN")}`} blue />
        <Card title="Under Review"   value={`₹${totalPending.toLocaleString("en-IN")}`} yellow />
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice #, title or status..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left">Invoice</th>
                  <th className="px-5 py-4 text-left">Amount</th>
                  <th className="px-5 py-4 text-left whitespace-nowrap">Dates</th>
                  <th className="px-5 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const overdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "PAID";
                  return (
                  <tr key={inv.id} className="border-t hover:bg-slate-50">

                    <td
                      className="px-5 py-4 cursor-default"
                      onMouseEnter={(e) => setTooltip({ inv, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={()  => setTooltip(null)}
                    >
                      <Link
                        to={tp(`/invoices/client/${inv.id}`)}
                        className="text-sm font-semibold whitespace-nowrap underline decoration-dotted text-indigo-600 hover:text-indigo-800 decoration-indigo-300"
                      >
                        {inv.invoiceNumber || inv.id}
                      </Link>
                      {inv.title && (
                        <p className="text-xs mt-0.5 text-slate-400 truncate max-w-[160px]">{inv.title}</p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800">
                          ₹{(inv.totalAmount || inv.amount || 0).toLocaleString("en-IN")}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap cursor-default">
                      <div className="group flex flex-col gap-0.5 transition-transform duration-200 hover:scale-[1.18] origin-left">
                        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                          <span className="font-medium text-slate-500 group-hover:text-slate-700">Issued</span>{" "}
                          {fmtDate(inv.issueDate) || "—"}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                          <span className={`font-medium ${overdue ? "text-red-500" : "text-slate-500 group-hover:text-slate-700"}`}>Due</span>{" "}
                          {fmtDate(inv.dueDate) || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="text-slate-600 hover:text-black"
                          title="Preview PDF"
                        >
                          <Eye size={18} />
                        </button>

                        <PDFDownloadLink
                          document={<InvoicePDF tenant={tenant} invoice={inv} />}
                          fileName={`invoice-${inv.invoiceNumber || inv.id}.pdf`}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE HOVER TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: Math.max(140, Math.min(tooltip.y, window.innerHeight - 140)), transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 ${{
            PAID:      "bg-green-600",
            PARTIAL:   "bg-amber-500",
            APPROVED:  "bg-blue-600",
            PENDING:   "bg-yellow-500",
            OVERDUE:   "bg-red-600",
            DRAFT:     "bg-slate-500",
            CANCELLED: "bg-slate-400",
          }[tooltip.inv.status] || "bg-indigo-600"}`}>
            <p className="font-mono text-sm font-bold text-white">{tooltip.inv.invoiceNumber || tooltip.inv.id}</p>
            <p className="text-[10px] font-semibold text-white/70 mt-0.5 uppercase tracking-wide">{tooltip.inv.status}</p>
          </div>
          <div className="p-4 space-y-3">
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
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due Date</p>
                <p className="mt-0.5 text-slate-700">{fmtDate(tooltip.inv.dueDate) || "—"}</p>
              </div>
              <div>
                <StatusBadge status={tooltip.inv.status} />
              </div>
            </div>
            {tooltip.inv.notes && (
              <p className="text-xs italic text-slate-400">{tooltip.inv.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold">
                Invoice Preview — {previewInvoice.invoiceNumber || previewInvoice.id}
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

      {/* REQUEST INVOICE MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Request an Invoice</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Project (optional)</label>
                <select
                  value={requestForm.projectId}
                  onChange={(e) => setRequestForm((f) => ({ ...f, projectId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">— No specific project —</option>
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">What is this invoice for? *</label>
                <input
                  value={requestForm.title}
                  onChange={(e) => setRequestForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Phase 2 milestone completion"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Notes (optional)</label>
                <textarea
                  rows="3"
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional details..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRequestModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                disabled={submittingRequest}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submittingRequest ? "Sending..." : "Send Request"}
              </button>
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
          green ? "text-green-600" : blue ? "text-blue-600" : yellow ? "text-yellow-600" : "text-slate-800"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PAID:     "bg-green-100 text-green-700",
    PARTIAL:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PENDING:  "bg-yellow-100 text-yellow-700",
    OVERDUE:  "bg-red-100 text-red-700",
  };

  const labels = {
    APPROVED: "APPROVED — Awaiting Payment",
  };

  return (
    <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {labels[status] || status}
    </span>
  );
}

function RequestStatusBadge({ status }) {
  const styles = {
    PENDING:   "bg-yellow-100 text-yellow-700",
    FULFILLED: "bg-green-100 text-green-700",
    DECLINED:  "bg-red-100 text-red-700",
  };
  return (
    <span className={`fp shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
