import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Archive, ArchiveRestore } from "lucide-react";
import toast from "react-hot-toast";

import { deleteProjectApi, getProjectsApi, updateProjectApi } from "../../services/api/project.api";
import { useAuth, useTenantPath, useHasPermission } from "../../store/hooks";
import { fmtDate } from "../../utils/formatDate";
import { fullClientName } from "../../utils/clientName";

const STATUS_CLS = {
  ACTIVE:    "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  PLANNING:  "bg-amber-100 text-amber-700",
  ON_HOLD:   "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const PRIORITY_CLS = {
  HIGH:   "bg-red-50 text-red-600",
  URGENT: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  LOW:    "bg-slate-100 text-slate-600",
};

export default function Projects() {
  const { user } = useAuth();
  const tp        = useTenantPath();
  const canCreate = useHasPermission("PROJECT_CREATE");
  const canEdit   = useHasPermission("PROJECT_UPDATE");
  const canDelete = useHasPermission("PROJECT_DELETE");

  const tenantId = user?.tenantId;
  const isClient = user?.role === "CLIENT";

  const [projects, setProjects]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [tooltip,  setTooltip]    = useState(null);
  const [search,   setSearch]     = useState("");
  const [acting,   setActing]     = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const ARCHIVED_STATUSES = ["COMPLETED", "CANCELLED"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const byArchive = showArchived
      ? projects.filter((p) => ARCHIVED_STATUSES.includes(p.status))
      : projects.filter((p) => !ARCHIVED_STATUSES.includes(p.status));
    if (!q) return byArchive;
    return byArchive.filter((p) =>
      (p.name         || "").toLowerCase().includes(q) ||
      (p.code         || "").toLowerCase().includes(q) ||
      (p.status       || "").toLowerCase().includes(q) ||
      (p.priority     || "").toLowerCase().includes(q) ||
      (p.type         || "").toLowerCase().includes(q) ||
      (p.client?.name || "").toLowerCase().includes(q)
    );
  }, [projects, search, showArchived]);

  /* ── FETCH ── */
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    getProjectsApi(tenantId)
      .then((res) => setProjects((res?.data || []).filter((p) => p.tenantId === tenantId)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  /* ── ARCHIVE / UNARCHIVE project (via CANCELLED ↔ ACTIVE status) ── */
  const handleToggleStatus = async (p) => {
    const newStatus = ARCHIVED_STATUSES.includes(p.status) ? "ACTIVE" : "CANCELLED";
    const label     = newStatus === "CANCELLED" ? "archived" : "unarchived";
    setActing(p.id);
    try {
      const res = await updateProjectApi(p.id, { tenantId, status: newStatus });
      setProjects((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, status: res.data.status } : x))
      );
      toast.success(`Project "${p.name}" ${label}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update project status");
    } finally {
      setActing(null);
    }
  };

  /* ── DELETE (no invoices only) ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProjectApi(deleteTarget.id, tenantId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Project deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Action buttons per project ── */
  const ProjectActions = ({ project }) => {
    const hasInvoices = (project._count?.invoices ?? 0) > 0;
    const busy = acting === project.id;

    return (
      <div className="flex gap-2">
        <Link
          to={tp(`/projects/${project.id}`)}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
        >
          View
        </Link>
        {canEdit && (
          <Link
            to={tp(`/projects/edit/${project.id}`)}
            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"
          >
            Edit
          </Link>
        )}

        {/* Delete — only when project has NO invoices */}
        {canDelete && !hasInvoices && (
          <button
            onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Delete
          </button>
        )}

        {/* Archive / Unarchive — when project has invoices */}
        {canEdit && hasInvoices && (
          <button
            onClick={() => handleToggleStatus(project)}
            disabled={busy}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
              ARCHIVED_STATUSES.includes(project.status)
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            {!busy && (ARCHIVED_STATUSES.includes(project.status)
              ? <ArchiveRestore size={13} />
              : <Archive size={13} />
            )}
            {busy ? "..." : ARCHIVED_STATUSES.includes(project.status) ? "Unarchive" : "Archive"}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="h-[90dvh] flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">Loading projects...</p>
      </section>
    );
  }

  /* ── SEARCH BAR ── */
  const searchBar = (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, code, client, status or priority..."
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
      />
    </div>
  );

  /* ── HEADER ── */
  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isClient ? "Your active projects" : "Manage all projects"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {!isClient && (
          <button
            onClick={() => { setShowArchived((v) => !v); setSearch(""); }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              showArchived
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {showArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            {showArchived ? "Active Projects" : "Archived"}
          </button>
        )}
        {canCreate && !showArchived && (
          <Link
            to={tp("/projects/create")}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            + New Project
          </Link>
        )}
      </div>
    </div>
  );

  /* ══ CLIENT VIEW ══ */
  if (isClient) {
    return (
      <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">
        {header}
        {searchBar}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">No projects found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">{project.name}</h2>
                    {project.code && <p className="text-xs text-slate-400">{project.code}</p>}
                  </div>
                  <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[project.status] || "bg-slate-100 text-slate-700"}`}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  {project.client?.name && (
                    <p><span className="font-medium text-slate-500">Client:</span> {fullClientName(project.client)}</p>
                  )}
                  <p><span className="font-medium text-slate-500">Budget:</span> ₹{Number(project.budget || 0).toLocaleString("en-IN")}</p>
                  <p><span className="font-medium text-slate-500">Spent:</span> ₹{Number(project.spent || 0).toLocaleString("en-IN")}</p>
                  <p><span className="font-medium text-slate-500">Priority:</span> {project.priority || "—"}</p>
                  <p><span className="font-medium text-slate-500">End Date:</span> {fmtDate(project.endDate)}</p>
                </div>
                <div className="mt-5">
                  <Link
                    to={tp(`/projects/${project.id}`)}
                    className="block w-full rounded-lg bg-indigo-50 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                  >
                    View Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  /* ══ ADMIN / MANAGER / ACCOUNT VIEW ══ */
  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">
      {header}

      {showArchived && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Archive size={16} className="shrink-0 text-amber-600" />
          Showing archived projects (Completed &amp; Cancelled) — hidden from active list.
        </div>
      )}

      {searchBar}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No projects found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id} className="border-t hover:bg-slate-50 transition-colors">

                    {/* PROJECT NAME */}
                    <td
                      className="px-4 py-3 cursor-default"
                      onMouseEnter={(e) => setTooltip({ project, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={()  => setTooltip(null)}
                    >
                      <p className="font-semibold text-slate-800 whitespace-nowrap underline decoration-dotted decoration-slate-400">
                        {project.name}
                      </p>
                      {project.code && (
                        <p className="text-xs text-slate-400 font-mono">{project.code}</p>
                      )}
                      {(project._count?.invoices ?? 0) > 0 && (
                        <p className="text-[10px] text-blue-500 mt-0.5">
                          {project._count.invoices} invoice{project._count.invoices > 1 ? "s" : ""}
                          {(() => {
                            const paid = (project.invoices || []).reduce((s, inv) => s + (inv._count?.payments || 0), 0);
                            return paid > 0
                              ? <span className="ml-1.5 text-green-600">· {paid} payment{paid > 1 ? "s" : ""}</span>
                              : null;
                          })()}
                        </p>
                      )}
                    </td>

                    {/* CLIENT */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {project.client?.name
                        ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{fullClientName(project.client)}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>

                    {/* STATUS + PRIORITY */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`fp rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[project.status] || "bg-slate-100 text-slate-700"}`}>
                          {project.status}
                        </span>
                        {project.priority ? (
                          <span className={`fp rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_CLS[project.priority] || "bg-slate-100 text-slate-600"}`}>
                            {project.priority}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* BUDGET + SPENT */}
                    <td className="px-4 py-3 whitespace-nowrap cursor-default">
                      <div className="group flex flex-col gap-0.5 transition-transform duration-200 hover:scale-[1.12] origin-left">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors duration-200">₹{Number(project.budget || 0).toLocaleString("en-IN")}</span>
                        <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors duration-200"><span className="font-medium text-slate-500 group-hover:text-slate-700">Spent</span> ₹{Number(project.spent || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </td>

                    {/* END DATE */}
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {fmtDate(project.endDate)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ProjectActions project={project} />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROJECT HOVER TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: Math.max(140, Math.min(tooltip.y, window.innerHeight - 140)), transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 ${{
            ACTIVE:    "bg-blue-600",
            PLANNING:  "bg-slate-500",
            COMPLETED: "bg-green-600",
            ON_HOLD:   "bg-yellow-500",
            CANCELLED: "bg-red-500",
          }[tooltip.project.status] || "bg-violet-600"}`}>
            <p className="text-sm font-bold text-white">{tooltip.project.name}</p>
            {tooltip.project.code && (
              <p className="text-[10px] font-mono text-white/60 mt-0.5">{tooltip.project.code}</p>
            )}
            {tooltip.project.client?.name && (
              <p className="mt-1 text-[11px] text-violet-200">
                Client: <span className="font-semibold text-white">{fullClientName(tooltip.project.client)}</span>
              </p>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <span className={`fp rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[tooltip.project.status] || "bg-slate-100 text-slate-700"}`}>
                {tooltip.project.status}
              </span>
              {tooltip.project.priority && (
                <span className={`fp rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_CLS[tooltip.project.priority] || "bg-slate-100 text-slate-600"}`}>
                  {tooltip.project.priority}
                </span>
              )}
              {tooltip.project.type && (
                <span className="fp rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {tooltip.project.type}
                </span>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Budget</span>
                <span>₹{Number(tooltip.project.budget || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Spent</span>
                <span>₹{Number(tooltip.project.spent || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-700">
                <span>Remaining</span>
                <span className={Number(tooltip.project.budget || 0) - Number(tooltip.project.spent || 0) < 0 ? "text-red-600" : "text-green-600"}>
                  ₹{(Number(tooltip.project.budget || 0) - Number(tooltip.project.spent || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Start Date</p>
                <p className="mt-0.5 text-slate-700">{fmtDate(tooltip.project.startDate) || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">End Date</p>
                <p className="mt-0.5 text-slate-700">{fmtDate(tooltip.project.endDate) || "—"}</p>
              </div>
            </div>
            {tooltip.project.description && (
              <p className="text-xs italic text-slate-400 line-clamp-2">{tooltip.project.description}</p>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">Delete Project</h2>
            <p className="mt-2 text-sm text-slate-500">
              Permanently delete <span className="font-medium text-slate-700">{deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
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
