import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

import { getInvoiceRequestsApi, declineInvoiceRequestApi } from "../../services/api/invoiceRequest.api";
import { useTenantPath } from "../../store/hooks";
import { fullClientName } from "../../utils/clientName";
import { fmtDate } from "../../utils/formatDate";

const FILTERS = ["ALL", "PENDING", "FULFILLED", "DECLINED"];

export default function InvoiceRequests() {
  const tp = useTenantPath();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("ALL");
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);

  const load = () => {
    setLoading(true);
    getInvoiceRequestsApi()
      .then((res) => setRequests(res.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter]
  );

  const counts = useMemo(() => {
    const c = { ALL: requests.length, PENDING: 0, FULFILLED: 0, DECLINED: 0 };
    requests.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requests]);

  const submitDecline = async () => {
    if (!declineTarget) return;
    setDeclining(true);
    try {
      await declineInvoiceRequestApi(declineTarget.id, declineReason.trim());
      toast.success("Request declined");
      setDeclineTarget(null);
      setDeclineReason("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to decline request");
    } finally {
      setDeclining(false);
    }
  };

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice Requests</h1>
          <p className="text-sm text-slate-500">Clients asking for a new invoice to be raised</p>
        </div>
        <Link to={tp("/invoices")} className="text-sm text-indigo-600 hover:underline">← Back to Invoices</Link>
      </div>

      {/* FILTER CHIPS */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            <span className={`rounded-full px-1.5 text-[10px] ${filter === f ? "bg-white/25" : "bg-slate-100"}`}>
              {counts[f] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-slate-400">
            <Inbox size={32} className="text-slate-300" />
            <p className="text-sm">No {filter !== "ALL" ? filter.toLowerCase() : ""} requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Request</th>
                  <th className="px-5 py-3">Requested</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{fullClientName(r.client) || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{r.project?.name || "—"}</td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-slate-700 truncate">{r.title}</p>
                      {r.notes && <p className="text-xs text-slate-400 truncate">{r.notes}</p>}
                      {r.status === "DECLINED" && r.declineReason && (
                        <p className="mt-0.5 text-xs italic text-red-400 truncate">Reason: {r.declineReason}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">{fmtDate(r.createdAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3.5">
                      {r.status === "PENDING" && (
                        <div className="flex items-center gap-3">
                          <Link
                            to={tp(`/invoices/create?requestId=${r.id}&clientId=${r.clientId}${r.projectId ? `&projectId=${r.projectId}` : ""}&title=${encodeURIComponent(r.title || "")}`)}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            Create Invoice
                          </Link>
                          <button
                            onClick={() => { setDeclineTarget(r); setDeclineReason(""); }}
                            className="text-xs font-semibold text-red-500 hover:underline"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {r.status === "FULFILLED" && r.invoice && (
                        <Link
                          to={tp(`/invoices/${r.invoice.id}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          <FileText size={12} />
                          {r.invoice.invoiceNumber || r.invoice.id}
                        </Link>
                      )}
                      {r.status === "DECLINED" && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DECLINE MODAL */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Decline Request</h2>
              <button onClick={() => setDeclineTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              {fullClientName(declineTarget.client)} — "{declineTarget.title}"
            </p>
            <textarea
              rows="3"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason (optional, shown to the client)..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeclineTarget(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDecline}
                disabled={declining}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {declining ? "Declining..." : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:   "bg-yellow-100 text-yellow-700",
    FULFILLED: "bg-green-100 text-green-700",
    DECLINED:  "bg-red-100 text-red-700",
  };
  return (
    <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
