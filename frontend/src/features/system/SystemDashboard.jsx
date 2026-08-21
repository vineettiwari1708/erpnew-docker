import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTenantsApi } from "../../services/api/tenant.api";

export default function SystemDashboard() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      const res = await getTenantsApi();
      setTenants(res.data || []);
    } catch (error) {
      console.error("System Dashboard Error:", error);
    }
  }

  const totalTenants = tenants.length;

  const activeTenants = tenants.filter(
    (t) => t.status === "ACTIVE"
  ).length;

  const inactiveTenants = tenants.filter(
    (t) => t.status !== "ACTIVE"
  ).length;

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          System Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Super Admin control panel for SaaS management
        </p>
      </div>

      {/* ================= ACTION BAR ================= */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-indigo-900">
              System Overview
            </h2>
            <p className="text-sm text-indigo-700">
              Manage tenants, billing, and system settings
            </p>
          </div>

          <Link
            to="/system/create-company"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Tenant
          </Link>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Card title="Total Tenants" value={totalTenants} />
        <Card title="Active Tenants" value={activeTenants} />
        <Card title="Inactive Tenants" value={inactiveTenants} />
        <Card title="System Health" value="100%" />
      </div>

      {/* ================= TENANTS LIST ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-800">
          Recent Tenants
        </h3>

        <div className="space-y-2">
          {/* {tenants.length > 0 ? (
            tenants.map((tenant) => {
              const isActive = tenant.status === "ACTIVE"; */}
               {tenants.length > 0 ? (
    tenants.slice(0, 5).map((tenant) => {
      const isActive =
        tenant.status === "ACTIVE";

              return (
                <Link
                  key={tenant.id}
                  to={`/system/tenants/${tenant.id}`}
                  className="flex items-center rounded-lg bg-slate-50 px-3 py-3 hover:bg-slate-100 transition"
                >

                  {/* LEFT */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {tenant.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {tenant.email || "No email"}
                    </p>
                  </div>

                  {/* CENTER STATUS */}
                  <div className="flex-1 flex justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {/* RIGHT ACTION TEXT */}
                
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">
              No tenants available
            </p>
          )}
        </div>
      </div>

    </section>
  );
}

/* ================= CARD COMPONENT ================= */
function Card({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </h2>

    </div>
  );
}
