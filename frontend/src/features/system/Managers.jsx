import { useEffect, useState } from "react";
import { UserPlus, Shield, Edit2, Trash2, X, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

import {
  getManagersApi,
  createManagerApi,
  updateManagerApi,
  deleteManagerApi,
} from "../../services/api/manager.api";

const PERMISSION_GROUPS = [
  {
    label: "Companies",
    keys: [
      { key: "COMPANY_VIEW",   label: "View companies" },
      { key: "COMPANY_CREATE", label: "Create companies" },
      { key: "COMPANY_UPDATE", label: "Update companies" },
      { key: "COMPANY_DELETE", label: "Delete companies" },
    ],
  },
  {
    label: "Company Users",
    keys: [
      { key: "COMPANY_USERS_VIEW",          label: "View company users" },
      { key: "COMPANY_USER_RESET_PASSWORD", label: "Reset a user's password" },
    ],
  },
  {
    label: "Backups",
    keys: [
      { key: "BACKUP_VIEW",   label: "View / download backups" },
      { key: "BACKUP_CREATE", label: "Create backups" },
      { key: "BACKUP_DELETE", label: "Delete backups" },
    ],
  },
  {
    label: "Platform",
    keys: [
      { key: "SETTINGS_VIEW", label: "View platform settings" },
    ],
  },
];

const emptyForm = { name: "", email: "", password: "", permissions: [] };

export default function Managers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // manager object, or null for create
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getManagersApi()
      .then((res) => setManagers(res.data || []))
      .catch(() => toast.error("Failed to load managers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, email: m.email, password: "", permissions: m.permissions || [] });
    setModalOpen(true);
  };

  const togglePerm = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const submit = async () => {
    if (!editing) {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        toast.error("Name, email and password are required");
        return;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    } else if (form.password && form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, permissions: form.permissions };
        if (form.password) payload.password = form.password;
        await updateManagerApi(editing.id, payload);
        toast.success("Manager updated");
      } else {
        await createManagerApi(form);
        toast.success("Manager created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save manager");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteManagerApi(deleteTarget.id);
      toast.success("Manager removed");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove manager");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Managers</h1>
          <p className="text-sm text-slate-500">Sub-admins with exactly the system tasks you grant them</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <UserPlus size={16} />
          New Manager
        </button>
      </div>

      {/* NOTE */}
      <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        <Shield size={16} className="mt-0.5 shrink-0" />
        <p>Managers can only do what you explicitly grant below. Managing managers themselves is reserved for you alone — a manager can never create or edit another manager.</p>
      </div>

      {/* LIST */}
      <div className="rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">Loading managers...</div>
        ) : managers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-slate-400">
            <UserPlus size={32} className="text-slate-300" />
            <p className="text-sm">No managers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {managers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden max-w-xs flex-wrap gap-1 sm:flex">
                    {m.permissions.length === 0 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">No permissions</span>
                    ) : (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                        {m.permissions.length} permission{m.permissions.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(m)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                {editing ? "Edit Manager" : "New Manager"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Email {editing ? "" : "*"}</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={!!editing}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <KeyRound size={12} />
                  {editing ? "New Password (leave blank to keep current)" : "Password *"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">Permissions</label>
                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label}</p>
                      <div className="space-y-1.5">
                        {group.keys.map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(key)}
                              onChange={() => togglePerm(key)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Manager"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-800">Remove Manager?</h3>
            <p className="mt-2 text-sm text-slate-500">
              <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) will lose all access immediately.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
