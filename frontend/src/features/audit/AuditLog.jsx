import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getAuditLogsApi } from "../../services/api/auditlog.api";

/* ── Config ── */

const ACTION_COLORS = {
  CREATE:          "bg-green-100 text-green-700 ring-green-200",
  UPDATE:          "bg-blue-100  text-blue-700  ring-blue-200",
  DELETE:          "bg-red-100   text-red-700   ring-red-200",
  APPROVE:         "bg-indigo-100 text-indigo-700 ring-indigo-200",
  CONFIRM_PAYMENT: "bg-purple-100 text-purple-700 ring-purple-200",
};

const ACTION_LABEL = {
  CREATE:          "Created",
  UPDATE:          "Updated",
  DELETE:          "Deleted",
  APPROVE:         "Approved",
  CONFIRM_PAYMENT: "Payment confirmed",
};

const FIELD_LABELS = {
  amount:        "Amount",
  tax:           "Tax",
  discount:      "Discount",
  totalAmount:   "Total",
  dueDate:       "Due Date",
  issueDate:     "Issue Date",
  paidAt:        "Paid On",
  status:        "Status",
  title:         "Title",
  notes:         "Notes",
  name:          "Name",
  email:         "Email",
  phone:         "Phone",
  department:    "Department",
  roleId:        "Role",
  passwordReset: "Password",
  portalCreated: "Portal Access",
  portalEmail:   "Portal Email",
  method:        "Payment Method",
  transactionId: "Transaction ID",
  paidAmount:    "Paid Amount",
};

const CURRENCY_FIELDS = new Set(["amount", "tax", "discount", "totalAmount", "paidAmount"]);
const DATE_FIELDS     = new Set(["dueDate", "issueDate", "paidAt"]);

// Raw FK / internal fields — never useful to show as-is
const SKIP_FIELDS = new Set([
  "clientId", "projectId", "tenantId", "invoiceId",
  "submittedById", "confirmedById", "createdBy", "approvedBy",
  "roleId", "isDeleted", "deletedAt", "id",
]);

const ENTITIES = ["All", "Invoice", "Payment", "Client", "User"];

/* ── Helpers ── */

function fmt(key, val) {
  if (val === null || val === undefined || val === "") return "—";
  if (key === "passwordReset") return val ? "Reset" : "Unchanged";
  if (key === "portalCreated") return val ? "Enabled" : "Disabled";
  if (CURRENCY_FIELDS.has(key)) return `₹${Number(val).toLocaleString("en-IN")}`;
  if (DATE_FIELDS.has(key)) {
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
}

function getDiff(before, after) {
  const b = before || {};
  const a = after  || {};
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  return [...keys]
    .filter((k) =>
      !k.startsWith("__") &&
      !SKIP_FIELDS.has(k) &&
      FIELD_LABELS[k] !== undefined &&           // only show known, labelled fields
      String(b[k] ?? "") !== String(a[k] ?? "")
    )
    .map((k) => ({ key: k, before: b[k], after: a[k] }));
}

function buildSummary(log) {
  const actor  = log.actorName || "System";
  const verb   = ACTION_LABEL[log.action] || log.action;
  const target = log.entityName
    ? `${log.entity} ${log.entityName}`
    : log.entity;

  if (log.action === "UPDATE") {
    const diff = getDiff(log.before, log.after);
    const changed = diff
      .map((d) => FIELD_LABELS[d.key] || d.key)
      .join(", ");
    return { actor, verb, target, changed };
  }
  return { actor, verb, target, changed: null };
}

/* ── Row ── */

function LogRow({ log }) {
  const [open, setOpen] = useState(false);
  const { actor, verb, target, changed } = buildSummary(log);
  const diff = getDiff(log.before, log.after);
  const hasDiff = diff.length > 0;
  const color = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* ── Main row ── */}
      <button
        type="button"
        onClick={() => hasDiff && setOpen((o) => !o)}
        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${hasDiff ? "cursor-pointer" : "cursor-default"}`}
      >
        {/* Expand icon */}
        <span className="mt-0.5 shrink-0 text-slate-300 w-4">
          {hasDiff
            ? open
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />
            : null}
        </span>

        {/* Action badge */}
        <span className={`fp mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${color}`}>
          {log.action}
        </span>

        {/* Summary text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 leading-snug">
            <span className="font-semibold text-slate-900">{actor}</span>
            {" "}
            <span className="text-slate-500">{verb}</span>
            {" "}
            <span className="font-medium text-indigo-700">{target}</span>
            {changed && (
              <span className="text-slate-400"> — {changed}</span>
            )}
          </p>
        </div>

        {/* Time */}
        <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap mt-0.5">
          {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </button>

      {/* ── Expanded diff ── */}
      {open && hasDiff && (
        <div className="px-11 pb-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 px-4 py-2 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Field</span>
              <span>Before</span>
              <span>After</span>
            </div>
            {/* Rows */}
            {diff.map(({ key, before: bv, after: av }) => (
              <div key={key} className="grid grid-cols-3 gap-2 px-4 py-2 border-b border-slate-100 last:border-0 text-sm">
                <span className="font-medium text-slate-600">
                  {FIELD_LABELS[key] || key}
                </span>
                <span className="text-red-500 truncate">
                  {fmt(key, bv)}
                </span>
                <span className="text-green-600 font-medium truncate">
                  {fmt(key, av)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */

export default function AuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [entity,  setEntity]  = useState("All");
  const [search,  setSearch]  = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    getAuditLogsApi({ entity: entity !== "All" ? entity : undefined, limit: 200 })
      .then((res) => setLogs(res.data || []))
      .catch((err) => {
        const msg = err?.response?.data?.message || "Failed to load audit logs";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [entity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter((l) => {
      const summary = `${l.actorName || ""} ${l.action} ${l.entity} ${l.entityName || ""}`.toLowerCase();
      return summary.includes(q);
    });
  }, [logs, search]);

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-5 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Who did what and when — click a row to see what changed</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Entity filters */}
          <div className="flex flex-wrap gap-1.5">
            {ENTITIES.map((e) => (
              <button
                key={e}
                onClick={() => setEntity(e)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  entity === e
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by person, action, or record name..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* LOG FEED */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-slate-400 animate-pulse">Loading logs...</p>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-12 text-red-500">
            <AlertCircle size={24} />
            <p className="font-medium">{error}</p>
            <button onClick={fetchLogs} className="mt-1 rounded-lg bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400">No audit logs found</p>
            <p className="mt-1 text-xs text-slate-400">
              Logs appear when invoices, clients, users, or payments are created, updated, or deleted.
            </p>
          </div>
        ) : (
          filtered.map((log) => <LogRow key={log.id} log={log} />)
        )}
      </div>

      <p className="text-right text-xs text-slate-400">{filtered.length} records</p>
    </section>
  );
}
