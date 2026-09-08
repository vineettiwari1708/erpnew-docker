import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, KeyRound, Eye, EyeOff, X, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getUsersApi, updateUserApi, resetUserPasswordApi } from "../../services/api/user.api";
import { useAuth, useTenantPath, useHasPermission } from "../../store/hooks";

export default function Users() {
  const { user: authUser } = useAuth();
  const tp = useTenantPath();
  const canCreate   = useHasPermission("USER_CREATE");
  const canResetPwd = useHasPermission("USER_MANAGE");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [search, setSearch] = useState("");

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState(null);
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [resetting,   setResetting]   = useState(false);

  const tenantId = authUser?.tenantId;

  /* ── SEARCH ── */
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      (u.name       || "").toLowerCase().includes(q) ||
      (u.email      || "").toLowerCase().includes(q) ||
      (u.role?.name || u.role || "").toLowerCase().includes(q) ||
      (u.status     || "").toLowerCase().includes(q) ||
      (u.userNumber || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  /* ── PAGINATION ── */
  const USERS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  /* ── FETCH ── */
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setFetchError(null);
    getUsersApi(tenantId)
      .then((res) => setUsers(res.data || []))
      .catch(() => {
        setFetchError("Failed to load users. Please refresh.");
        toast.error("Failed to load users");
      })
      .finally(() => setLoading(false));
  }, [tenantId]);

  /* ── RESET PASSWORD ── */
  const openReset = (u) => { setResetTarget(u); setNewPwd(""); setConfirmPwd(""); setShowPwd(false); };

  const handleResetPassword = async () => {
    if (!newPwd || newPwd.length < 6) { toast.error("Minimum 6 characters"); return; }
    if (newPwd !== confirmPwd)         { toast.error("Passwords do not match"); return; }
    setResetting(true);
    try {
      await resetUserPasswordApi(resetTarget.id, tenantId, newPwd);
      toast.success(`Password updated for ${resetTarget.name}`);
      setResetTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  /* ── DISABLE / ENABLE ── */
  const handleToggleStatus = async (u) => {
    const newStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const label = newStatus === "INACTIVE" ? "Disabled" : "Enabled";
    setToggling(u.id);
    try {
      await updateUserApi(u.id, { tenantId, status: newStatus });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status: newStatus } : x))
      );
      toast.success(`${u.name} ${label}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update user status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage staff accounts (Admin, Manager, Account)</p>
        </div>
        {canCreate && (
          <Link
            to={tp("/users/create")}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 text-center"
          >
            + Add User
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
          placeholder="Search by name, email, role or status..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[calc(95vh-220px)] overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-[440px] w-full text-sm">

              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-10 text-center text-slate-500">Loading users...</td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-10 text-center text-rose-500">{fetchError}</td>
                  </tr>
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 transition hover:bg-slate-50">

                      {/* USER */}
                      <td
                        className="px-4 py-4 cursor-default"
                        onMouseEnter={(e) => setTooltip({ u, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                        onMouseLeave={()  => setTooltip(null)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                            u.status === "ACTIVE" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
                          }`}>
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <Link to={tp(`/users/${u.id}`)} className="font-medium text-slate-800 hover:text-indigo-600">
                              {u.name}
                            </Link>
                            <p className="text-xs text-slate-400">{u.email || u.userNumber || u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* ROLE + STATUS */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="fp rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 w-fit">
                            {u.role?.name ?? u.role}
                          </span>
                          <span className={`fp rounded-full px-3 py-1 text-xs font-semibold w-fit ${
                            u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {u.status || "ACTIVE"}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={tp(`/users/${u.id}`)}
                            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                          >
                            View
                          </Link>
                          <Link
                            to={tp(`/users/edit/${u.id}`)}
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"
                          >
                            Edit
                          </Link>
                          {/* Users are never deleted — only disabled/enabled */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={toggling === u.id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                              u.status === "ACTIVE"
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {toggling === u.id ? "..." : u.status === "ACTIVE" ? "Disable" : "Enable"}
                          </button>
                          {canResetPwd && u.role?.name !== "ADMIN" && (
                            <button
                              onClick={() => openReset(u)}
                              className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                            >
                              <KeyRound size={11} />
                              Reset Pwd
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-10 text-center text-slate-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {!loading && users.length > USERS_PER_PAGE && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium">{(currentPage - 1) * USERS_PER_PAGE + 1}</span>
              {" "}to{" "}
              <span className="font-medium">{Math.min(currentPage * USERS_PER_PAGE, users.length)}</span>
              {" "}of{" "}
              <span className="font-medium">{users.length}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* RESET PASSWORD MODAL */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                  <KeyRound size={18} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Reset Password</h3>
                  <p className="text-xs text-slate-500">{resetTarget.name} · {resetTarget.role?.name}</p>
                </div>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700">
                <ShieldCheck size={12} />
                User must use this new password on next login.
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setResetTarget(null)} disabled={resetting}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={resetting}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                {resetting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLTIP */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: tooltip.x + 14, top: Math.max(120, Math.min(tooltip.y, window.innerHeight - 120)), transform: "translateY(-50%)" }}
        >
          <div className={`rounded-t-2xl px-4 py-3 flex items-center gap-3 ${{
            ACTIVE:    "bg-indigo-600",
            INACTIVE:  "bg-slate-400",
            SUSPENDED: "bg-red-500",
          }[tooltip.u.status] || "bg-indigo-600"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              {tooltip.u.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{tooltip.u.name}</p>
              <p className="text-[10px] text-white/70 font-mono truncate">{tooltip.u.userNumber || tooltip.u.id}</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email</p>
              <p className="text-sm text-slate-700 truncate">{tooltip.u.email || "—"}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <span className="fp rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {tooltip.u.role?.name ?? tooltip.u.role ?? "—"}
              </span>
              <span className={`fp rounded-full px-3 py-1 text-xs font-semibold ${
                tooltip.u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {tooltip.u.status || "ACTIVE"}
              </span>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
