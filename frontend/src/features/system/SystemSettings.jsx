import { useEffect, useState, useCallback } from "react";
import { Building2, Users, FileText, CreditCard, AlertCircle, Layers, ShieldCheck, RefreshCw } from "lucide-react";
import http from "../../services/api/http";

async function getSettingsApi() { return { data: (await http.get("/system/settings")).data }; }

export default function SystemSettings() {
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [data,         setData]         = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    getSettingsApi()
      .then((res) => { setData(res.data); setLastRefreshed(new Date()); })
      .catch(() => setError("Failed to load platform settings"))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex h-[calc(95vh-80px)] items-center justify-center">
      <p className="animate-pulse text-slate-500">Loading settings...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex h-[calc(95vh-80px)] flex-col items-center justify-center gap-3">
      <AlertCircle size={36} className="text-red-400" />
      <p className="text-slate-600">{error || "Settings unavailable"}</p>
    </div>
  );

  const { platform, stats } = data;

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2 pb-10">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Platform Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of the platform configuration and usage statistics.</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60 transition"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {lastRefreshed && (
            <span className="text-[10px] text-slate-400">
              Last updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Platform info card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{platform.name}</h2>
            <p className="text-xs text-slate-400">Version {platform.version}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Building2 size={18} className="text-indigo-600" />}
            label="Total Companies"
            value={stats.tenants}
            color="bg-indigo-50"
          />
          <StatCard
            icon={<Users size={18} className="text-violet-600" />}
            label="Total Users"
            value={stats.users}
            color="bg-violet-50"
          />
          <StatCard
            icon={<FileText size={18} className="text-sky-600" />}
            label="Invoices"
            value={stats.invoices}
            color="bg-sky-50"
          />
          <StatCard
            icon={<CreditCard size={18} className="text-emerald-600" />}
            label="Payments"
            value={stats.payments}
            color="bg-emerald-50"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">

        {/* Plan breakdown */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-800">Companies by Plan</h3>
          </div>
          {Object.entries(stats.planBreakdown || {}).length === 0 ? (
            <p className="text-sm text-slate-400">No data</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 capitalize">{plan.toLowerCase()}</span>
                  <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-800">Companies by Status</h3>
          </div>
          {Object.entries(stats.statusBreakdown || {}).length === 0 ? (
            <p className="text-sm text-slate-400">No data</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className={`h-2 w-2 rounded-full ${
                      status === "ACTIVE"    ? "bg-emerald-500"
                      : status === "SUSPENDED" ? "bg-red-500"
                      : "bg-amber-400"
                    }`} />
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                  <span className={`fp rounded-full px-3 py-0.5 text-xs font-bold ${
                    status === "ACTIVE"    ? "bg-emerald-50 text-emerald-700"
                    : status === "SUSPENDED" ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                  }`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Read-only platform config */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Platform Configuration</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ConfigRow label="Platform Name"  value={platform.name} />
          <ConfigRow label="Version"        value={platform.version} />
          <ConfigRow label="Access Level"   value="Super Admin" />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Platform configuration is managed via environment variables. Contact your system administrator to make changes.
        </p>
      </div>

    </section>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`rounded-xl ${color} p-4`}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value ?? "—"}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ConfigRow({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}
