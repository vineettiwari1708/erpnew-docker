import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Archive, ArchiveRestore } from "lucide-react";
import toast from "react-hot-toast";
import { getClientsApi, deleteClientApi, updateClientApi, archiveClientApi } from "../../services/api/client.api";
import { useTenantPath, useHasPermission, useAuth } from "../../store/hooks";

export default function Clients() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const canCreate = useHasPermission("CLIENT_CREATE");
  const canEdit   = useHasPermission("CLIENT_UPDATE");
  const canDelete = useHasPermission("CLIENT_DELETE");

  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tooltip, setTooltip]         = useState(null);
  const [search, setSearch]           = useState("");
  const [acting, setActing]           = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  /* ── DELETE CONFIRM MODAL ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── PAGINATION ── */
  const CLIENTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  /* ── SEARCH ── */
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.name         || "").toLowerCase().includes(q) ||
      (c.email        || "").toLowerCase().includes(q) ||
      (c.phone        || "").toLowerCase().includes(q) ||
      (c.company      || "").toLowerCase().includes(q) ||
      (c.clientNumber || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PER_PAGE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * CLIENTS_PER_PAGE;
    return filteredClients.slice(start, start + CLIENTS_PER_PAGE);
  }, [filteredClients, currentPage]);

  /* ── FETCH ── */
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    getClientsApi(tenantId, { archived: showArchived })
      .then((res) => setClients(res.data || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [tenantId, showArchived]);

  useEffect(() => { setCurrentPage(1); }, [clients.length, showArchived]);

  /* ── DISABLE / ENABLE ── */
  const handleToggleStatus = async (c) => {
    const newStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const label     = newStatus === "INACTIVE" ? "disabled" : "enabled";
    setActing(c.id);
    try {
      await updateClientApi(c.id, { tenantId, status: newStatus });
      setClients((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x))
      );
      toast.success(`${c.name} ${label}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update client status");
    } finally {
      setActing(null);
    }
  };

  /* ── ARCHIVE / UNARCHIVE ── */
  const handleArchive = async (c) => {
    setActing(c.id);
    try {
      const res = await archiveClientApi(c.id);
      const nowArchived = res.data.isArchived;
      toast.success(`${c.name} ${nowArchived ? "archived" : "unarchived"}`);
      // Remove from current list (moved to other tab)
      setClients((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to archive client");
    } finally {
      setActing(null);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClientApi(deleteTarget.id);
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Client deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Action buttons per client ── */
  const ClientActions = ({ c }) => {
    const hasRecords = (c._count?.invoices ?? 0) > 0 || (c._count?.payments ?? 0) > 0;
    const busy = acting === c.id;

    if (showArchived) {
      return (
        <div className="flex gap-2">
          <Link
            to={tp(`/clients/${c.id}`)}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
          >
            View
          </Link>
          {canEdit && (
            <button
              onClick={() => handleArchive(c)}
              disabled={busy}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
            >
              <ArchiveRestore size={13} />
              {busy ? "..." : "Unarchive"}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        <Link
          to={tp(`/clients/${c.id}`)}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
        >
          View
        </Link>

        {canEdit && (
          <Link
            to={tp(`/clients/edit/${c.id}`)}
            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"
          >
            Edit
          </Link>
        )}

        {/* Archive — when client has records (instead of disable) */}
        {canEdit && hasRecords && (
          <button
            onClick={() => handleArchive(c)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
          >
            <Archive size={13} />
            {busy ? "..." : "Archive"}
          </button>
        )}

        {/* Delete — only when client has NO invoices/payments */}
        {canDelete && !hasRecords && (
          <button
            onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Delete
          </button>
        )}

        {/* Disable / Enable — only when INACTIVE (no records) */}
        {canEdit && !hasRecords && c.status === "INACTIVE" && (
          <button
            onClick={() => handleToggleStatus(c)}
            disabled={busy}
            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
          >
            {busy ? "..." : "Enable"}
          </button>
        )}
      </div>
    );
  };

  /* ── UI ── */
  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all tenant clients</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Archive toggle */}
          <button
            onClick={() => { setShowArchived((v) => !v); setSearch(""); }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              showArchived
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {showArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            {showArchived ? "Active Clients" : "Archived"}
          </button>

          {canCreate && !showArchived && (
            <Link
              to={tp("/clients/create")}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 text-center"
            >
              + Add Client
            </Link>
          )}
        </div>
      </div>

      {/* ARCHIVED BANNER */}
      {showArchived && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Archive size={16} className="shrink-0 text-amber-600" />
          Showing archived clients — these are hidden from active lists and calculations.
        </div>
      )}

      {/* SEARCH */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search by name, email, phone or company..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="max-h-[calc(95vh-260px)] overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm">

              <thead className="sticky top-0 z-10 border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Records</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">Loading clients...</td></tr>
                ) : paginatedClients.length > 0 ? (
                  paginatedClients.map((c) => (
                    <tr key={c.id} className={`border-b transition ${showArchived ? "bg-amber-50/30 opacity-75 hover:opacity-100" : "hover:bg-slate-50"}`}>

                      {/* CLIENT NAME */}
                      <td
                        className="px-4 py-4 cursor-default"
                        onMouseEnter={(e) => setTooltip({ c, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                        onMouseLeave={()  => setTooltip(null)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                            showArchived ? "bg-amber-100 text-amber-600" : c.status === "ACTIVE" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
                          }`}>
                            {c.name?.charAt(0)}
                          </div>
                          <div>
                            <Link to={tp(`/clients/${c.id}`)} className={`font-medium hover:text-indigo-600 ${showArchived ? "text-slate-500" : "text-slate-800"}`}>
                              {c.prefix ? `${c.prefix} ${c.name}` : c.name}
                            </Link>
                            <p className="text-xs text-slate-400">{c.clientNumber || c.id}</p>
                            {showArchived && (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                                <Archive size={10} /> Archived
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CONTACT — email + phone */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-slate-600">{c.email || <span className="text-slate-300">No email</span>}</span>
                          <span className="text-xs text-slate-400">{c.phone || <span className="text-slate-300">No phone</span>}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4">
                        <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${
                          c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      {/* RECORDS COUNT */}
                      <td className="px-4 py-4">
                        {(c._count?.invoices ?? 0) > 0 || (c._count?.payments ?? 0) > 0 ? (
                          <span className="fp rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                            {c._count?.invoices ?? 0} inv · {c._count?.payments ?? 0} pay
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4">
                        <ClientActions c={c} />
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                      {showArchived ? "No archived clients" : "No clients found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {!loading && clients.length > CLIENTS_PER_PAGE && (
          <div className="flex items-center justify-between border-t px-4 py-4">
            <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: Math.max(120, Math.min(tooltip.y, window.innerHeight - 120)), transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 flex items-center gap-3 ${{
            ACTIVE:    "bg-emerald-600",
            INACTIVE:  "bg-slate-400",
            SUSPENDED: "bg-red-500",
          }[tooltip.c.status] || "bg-emerald-600"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              {tooltip.c.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{tooltip.c.name}</p>
              {tooltip.c.company && <p className="text-[10px] text-white/70 truncate">{tooltip.c.company}</p>}
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email</p>
              <p className="text-sm text-slate-700 truncate">{tooltip.c.email || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Phone</p>
              <p className="text-sm text-slate-700">{tooltip.c.phone || "—"}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${
                tooltip.c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {tooltip.c.status}
              </span>
              {(tooltip.c._count?.invoices ?? 0) > 0 && (
                <span className="fp rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  {tooltip.c._count.invoices} invoices
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">Delete Client</h2>
            <p className="mt-2 text-sm text-slate-500">
              Permanently delete <span className="font-medium text-slate-700">{deleteTarget.name}</span> and all their projects? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
