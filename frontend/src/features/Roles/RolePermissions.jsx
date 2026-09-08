import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getRoleByNameApi, updateRolePermissionsApi } from "../../services/api/role.api";

const ALL_PERMISSIONS = [
  "DASHBOARD_VIEW",
  "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE", "USER_MANAGE",
  "CLIENT_VIEW", "CLIENT_CREATE", "CLIENT_UPDATE", "CLIENT_DELETE",
  "PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE",
  "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE", "INVOICE_APPROVE",
  "PAYMENT_VIEW", "PAYMENT_CREATE", "PAYMENT_UPDATE", "PAYMENT_DELETE", "PAYMENT_CONFIRM",
  "LEDGER_VIEW", "ROLE_VIEW", "ROLE_MANAGE", "REPORT_VIEW",
];

function groupByModule(keys) {
  const map = {};
  keys.forEach((key) => {
    const module = key.split("_")[0];
    if (!map[module]) map[module] = [];
    map[module].push(key);
  });
  return map;
}

const MODULE_COLORS = {
  DASHBOARD: "bg-slate-100 text-slate-700 border-slate-300",
  USER:      "bg-blue-100 text-blue-700 border-blue-300",
  CLIENT:    "bg-cyan-100 text-cyan-700 border-cyan-300",
  PROJECT:   "bg-violet-100 text-violet-700 border-violet-300",
  INVOICE:   "bg-amber-100 text-amber-700 border-amber-300",
  PAYMENT:   "bg-emerald-100 text-emerald-700 border-emerald-300",
  LEDGER:    "bg-pink-100 text-pink-700 border-pink-300",
  ROLE:      "bg-indigo-100 text-indigo-700 border-indigo-300",
};

export default function RolePermissions() {
  const { id: roleName }  = useParams();
  const tenantId          = useSelector((s) => s.auth.user?.tenantId);

  const [selected, setSelected]   = useState(new Set());
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleInfo, setRoleInfo]   = useState(null);

  /* ── LOAD current permissions from backend ── */
  useEffect(() => {
    if (!tenantId || !roleName) return;
    setLoading(true);
    getRoleByNameApi(tenantId, roleName)
      .then((data) => {
        setRoleInfo(data);
        setSelected(new Set(data.permissions.map((p) => p.key)));
      })
      .catch(() => toast.error("Failed to load role. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [tenantId, roleName]);

  /* ── Toggle a single permission ── */
  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  /* ── Toggle all in a module ── */
  function toggleModule(keys) {
    const allChecked = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => allChecked ? next.delete(k) : next.add(k));
      return next;
    });
  }

  /* ── Save to backend ── */
  async function handleSave() {
    setSaving(true);
    try {
      await updateRolePermissionsApi(tenantId, roleName, [...selected]);
      toast.success("Permissions saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => groupByModule(ALL_PERMISSIONS), []);

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="h-[90dvh] flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading permissions...</p>
      </div>
    );
  }

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {roleName} — Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {roleInfo?.users?.length ?? 0} user{roleInfo?.users?.length !== 1 ? "s" : ""} assigned · {selected.size} of {ALL_PERMISSIONS.length} permissions active
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* PERMISSION GROUPS */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([module, keys]) => {
          const allChecked  = keys.every((k) => selected.has(k));
          const someChecked = keys.some((k) => selected.has(k));
          const colorClass  = MODULE_COLORS[module] || "bg-slate-100 text-slate-700 border-slate-300";

          return (
            <div key={module} className="rounded-2xl border bg-white shadow-sm overflow-hidden">

              {/* MODULE HEADER */}
              <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold tracking-wide ${colorClass}`}>
                    {module}
                  </span>
                  <span className="text-xs text-slate-500">
                    {keys.filter((k) => selected.has(k)).length} / {keys.length} selected
                  </span>
                </div>

                {/* SELECT ALL FOR MODULE */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-slate-500">All</span>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleModule(keys)}
                    className="h-4 w-4 accent-indigo-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* PERMISSIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                {keys.map((key) => {
                  const isChecked = selected.has(key);
                  const label = key.replace(`${module}_`, "").replace(/_/g, " ");

                  return (
                    <label
                      key={key}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                        isChecked
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-medium ${isChecked ? "text-indigo-700" : "text-slate-700"}`}>
                          {label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{key}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(key)}
                        className="h-4 w-4 accent-indigo-600 cursor-pointer shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* SAVE BOTTOM */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

    </section>
  );
}
