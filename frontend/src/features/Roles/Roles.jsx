import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getRolesApi } from "../../services/api/role.api";
import { useAuth, useTenantPath } from "../../store/hooks";

export default function Roles() {
  const { user } = useAuth();
  const tp = useTenantPath();
  const tenantId = user?.tenantId;

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    getRolesApi(tenantId)
      .then((data) => setRoles(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  const totalPermissions = [...new Set(roles.flatMap((r) => r.permissions || []))].length;
  const totalUsers = roles.reduce((sum, r) => sum + (r.userCount || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading roles...</p>
      </div>
    );
  }

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Roles & Permissions
        </h1>
        <p className="text-sm text-slate-500">
          Manage company access control
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Card title="Total Roles" value={roles.length} />
        <Card title="Permissions" value={totalPermissions} />
        <Card title="Users" value={totalUsers} />
        <Card title="System" value="Admin Panel" />
      </div>

      {/* ================= ROLES LIST ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">

        <h3 className="mb-3 text-base font-semibold text-slate-800">
          Company Roles
        </h3>

        <div className="space-y-2">

          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center rounded-xl bg-slate-50 px-4 py-4 hover:bg-slate-100 transition"
            >

              {/* LEFT */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {role.name}
                </p>
                <p className="text-xs text-slate-500">
                  {getRoleDescription(role.name)}
                </p>
              </div>

              {/* USERS */}
              <div className="hidden md:flex flex-1 justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {role.userCount ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">Users</p>
                </div>
              </div>

              {/* PERMISSIONS */}
              <div className="hidden lg:flex flex-1 justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {role.permissionCount ?? (role.permissions?.length ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400">Permissions</p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2">
                <Link
                  to={tp(`/roles/${role.name}`)}
                  className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  Permissions
                </Link>
              </div>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}

/* ================= CARD ================= */
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

/* ================= ROLE DESCRIPTION ================= */
function getRoleDescription(role) {
  const map = {
    ADMIN: "Full company management access",
    MANAGER: "Project and invoice control",
    ACCOUNT: "Finance and billing operations",
    CLIENT: "Limited client access",
  };

  return map[role] || "No description";
}
