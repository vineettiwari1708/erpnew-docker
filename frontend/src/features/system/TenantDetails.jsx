import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Edit, FileText, Users, CreditCard, Trash2, Phone, Globe,
  Building2, Calendar, AlertTriangle, X, KeyRound, Eye, EyeOff, ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getTenantsApi,
  updateTenantApi,
  deleteTenantApi,
} from "../../services/api/tenant.api";
import http from "../../services/api/http";

const getTenantUsersApi    = (tenantId)             => http.get(`/system/tenants/${tenantId}/users`);
const resetUserPasswordApi = (tenantId, userId, pw) => http.put(`/system/tenants/${tenantId}/users/${userId}/reset-password`, { newPassword: pw });

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Users + password reset
  const [users, setUsers]           = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [resetTarget, setResetTarget]   = useState(null); // { id, name }
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPw,   setConfirmPw]     = useState("");
  const [showPw,      setShowPw]        = useState(false);
  const [resetting,   setResetting]     = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getTenantsApi();
        const found = (res.data || []).find((t) => t.id === id);
        if (!found) { setError("Tenant not found"); return; }
        setTenant(found);

        // Load users for this tenant
        setUsersLoading(true);
        try {
          const ur = await getTenantUsersApi(id);
          setUsers(ur.data || []);
        } catch { /* non-fatal */ }
        finally { setUsersLoading(false); }
      } catch (err) {
        setError(err?.message || "Failed to load tenant");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const openResetModal = (user) => {
    setResetTarget(user);
    setNewPassword("");
    setConfirmPw("");
    setShowPw(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Minimum 6 characters"); return; }
    if (newPassword !== confirmPw)               { toast.error("Passwords do not match"); return; }
    setResetting(true);
    try {
      await resetUserPasswordApi(id, resetTarget.id, newPassword);
      toast.success(`Password updated for ${resetTarget.name}`);
      setResetTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const actionBtn =
    "flex flex-col items-center justify-center rounded-xl border bg-slate-50 p-3 hover:bg-slate-100 hover:shadow-md transition";

  const toggleStatus = async () => {
    setToggling(true);
    setActionError("");
    const newStatus = tenant.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateTenantApi(id, { status: newStatus });
      setTenant((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      setActionError(err?.message || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setActionError("");
    try {
      await deleteTenantApi(id);
      navigate("/system/tenants");
    } catch (err) {
      setActionError(err?.message || "Failed to delete company");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Loading tenant...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertTriangle className="text-red-400" size={36} />
        <p className="text-slate-600">{error}</p>
        <Link
          to="/system/tenants"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to tenants
        </Link>
      </div>
    );
  }

  const isActive = tenant.status === "ACTIVE";

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {tenant.name}
          </h1>
          <p className="text-sm text-slate-500">Tenant Full Profile</p>
        </div>
        <Link
          to="/system/tenants"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back
        </Link>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={16} />
          {actionError}
        </div>
      )}

      {/* TOP GRID */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* BASIC INFO */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
              {tenant.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {tenant.name}
              </h2>
              <p className="text-sm text-slate-500">{tenant.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <InfoRow
              icon={<Phone size={16} className="text-slate-500" />}
              label={tenant.phone || "—"}
            />
            <InfoRow
              icon={<Globe size={16} className="text-slate-500" />}
              label={tenant.website || "—"}
            />
            <InfoRow
              icon={<Building2 size={16} className="text-slate-500" />}
              label={tenant.industry || "—"}
            />
            <InfoRow
              icon={<Users size={16} className="text-slate-500" />}
              label={tenant.employees ? `${tenant.employees} employees` : "—"}
            />
            <InfoRow
              icon={<CreditCard size={16} className="text-slate-500" />}
              label={tenant.plan || "—"}
            />
            <InfoRow
              icon={
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    isActive ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
              }
              label={
                <span
                  className={`font-medium ${
                    isActive ? "text-green-600" : "text-slate-500"
                  }`}
                >
                  {tenant.status}
                </span>
              }
            />
            <InfoRow
              icon={<FileText size={16} className="text-slate-500" />}
              label={
                <>
                  {tenant.gstNumber || "—"} <b>(GST)</b>
                </>
              }
            />
            <InfoRow
              icon={<FileText size={16} className="text-slate-500" />}
              label={
                <>
                  {tenant.gstType || "—"} <b>(Type)</b>
                </>
              }
            />
            <InfoRow
              icon={<FileText size={16} className="text-slate-500" />}
              label={
                <>
                  {tenant.gstRate != null ? `${tenant.gstRate}%` : "—"}{" "}
                  <b>(Rate)</b>
                </>
              }
            />
            <InfoRow
              icon={<Calendar size={16} className="text-slate-500" />}
              label={
                <>
                  {tenant.joinedAt || "—"} <b>(Joined)</b>
                </>
              }
            />
          </div>
        </div>

        {/* FINANCIAL */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Financial Overview
          </h3>
          <div className="space-y-3 text-sm">
            <StatRow label="Total Invoices" value={tenant.totalInvoices ?? 0} />
            <StatRow
              label="Pending"
              value={tenant.pendingInvoices ?? 0}
              color="text-yellow-700"
              bg="bg-yellow-50"
            />
            <StatRow
              label="Credit"
              value={`₹${(tenant.totalCredit ?? 0).toLocaleString()}`}
              color="text-green-700"
              bg="bg-green-50"
            />
            <StatRow
              label="Debit"
              value={`₹${(tenant.totalDebit ?? 0).toLocaleString()}`}
              color="text-red-700"
              bg="bg-red-50"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Actions
          </h3>

          {/* STATUS TOGGLE */}
          <div
            className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
              isActive
                ? "border-green-200 bg-green-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Pulse dot */}
              <span className="relative flex h-3 w-3">
                {isActive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                )}
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    isActive ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {isActive ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-slate-500">
                  {isActive
                    ? "Company is live and operational"
                    : "Company is suspended"}
                </p>
              </div>
            </div>

            {/* iOS-style toggle switch */}
            <button
              onClick={toggleStatus}
              disabled={toggling}
              role="switch"
              aria-checked={isActive}
              title={isActive ? "Click to deactivate" : "Click to activate"}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive ? "bg-green-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to={`/system/edit-company/${tenant.id}`}
              className={actionBtn}
            >
              <Edit className="text-indigo-600" />
              <span className="mt-1 text-xs">Edit</span>
            </Link>

            <Link
              to={`/system/company-invoices/${tenant.id}`}
              className={actionBtn}
            >
              <FileText className="text-green-600" />
              <span className="mt-1 text-xs">Invoices</span>
            </Link>
          </div>

          {/* DANGER ZONE */}
          <div className="mt-4 border-t pt-4">
            <button
              onClick={() => {
                setActionError("");
                setShowDeleteConfirm(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 size={16} />
              Delete Company
            </button>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-800">
          Company Description
        </h3>
        <p className="text-sm text-slate-600">
          {tenant.description || "No description available."}
        </p>
      </div>

      {/* ADDRESS */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-800">Address</h3>
        <div className="space-y-1 text-sm text-slate-600">
          <p>{tenant.address?.line1 || "—"}</p>
          <p>
            {tenant.address?.city}, {tenant.address?.state}
          </p>
          <p>
            {tenant.address?.country} - {tenant.address?.pincode}
          </p>
        </div>
      </div>

      {/* COMPANY USERS */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-800">Company Users</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{users.length}</span>
        </div>

        {usersLoading ? (
          <p className="text-sm text-slate-400 animate-pulse">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-400">No users found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                    {(u.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-green-500" : "bg-slate-300"}`} />
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {u.role?.name || "—"}
                    </span>
                  </div>
                  <button
                    onClick={() => openResetModal(u)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
                  >
                    <KeyRound size={12} />
                    Reset Password
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESET PASSWORD MODAL */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <KeyRound size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Reset Password</h3>
                  <p className="text-xs text-slate-500">{resetTarget.name} · {resetTarget.email}</p>
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
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <ShieldCheck size={12} />
                The user will need to use this new password on next login.
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setResetTarget(null)} disabled={resetting}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={resetting}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                {resetting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">
                  Delete Company
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Are you sure you want to delete{" "}
                  <strong>{tenant.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function InfoRow({ icon, label }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatRow({ label, value, color = "text-slate-700", bg = "bg-slate-50" }) {
  return (
    <div className={`flex justify-between rounded-xl ${bg} p-3`}>
      <span>{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
