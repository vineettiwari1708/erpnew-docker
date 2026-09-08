import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Receipt,
  Wallet,
  Shield,
  BookOpen,
  PanelLeftClose,
  Building2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import { useAuth } from "../../store/hooks";

/* ── STAFF / ADMIN MENU ── */
export const menu = [
  { name: "Dashboard",  path: "/dashboard",  perm: "DASHBOARD_VIEW", icon: LayoutDashboard },
  { name: "Clients",    path: "/clients",    perm: "CLIENT_VIEW",    icon: Users },
  { name: "Projects",   path: "/projects",   perm: "PROJECT_VIEW",   icon: FolderKanban },
  { name: "Invoices",   path: "/invoices",   perm: "INVOICE_VIEW",   icon: Receipt },
  { name: "Requests",   path: "/invoice-requests", perm: "INVOICE_VIEW", icon: Inbox },
  { name: "Payments",   path: "/payments",   perm: "PAYMENT_VIEW",   icon: Wallet },
  { name: "Ledger",     path: "/ledger",     perm: "LEDGER_VIEW",    icon: BookOpen },
  { name: "Users",      path: "/users",      perm: "USER_MANAGE",    icon: Users },
  { name: "Roles",      path: "/roles",      perm: "ROLE_MANAGE",    icon: Shield },
  { name: "Audit Log",  path: "/audit",      perm: "ROLE_MANAGE",    icon: ClipboardList },
];

/* ── CLIENT PORTAL MENU — only their own data, no org-level items ── */
const clientMenu = [
  { name: "Dashboard",  path: "/dashboard",       perm: "DASHBOARD_VIEW", icon: LayoutDashboard },
  { name: "My Invoices", path: "/invoices/client", perm: "INVOICE_VIEW",   icon: Receipt },
  { name: "My Payments", path: "/payments/client", perm: "PAYMENT_VIEW",   icon: Wallet },
  { name: "My Projects", path: "/projects",        perm: "PROJECT_VIEW",   icon: FolderKanban },
  { name: "Statement",   path: null,               perm: "CLIENT_VIEW",    icon: FileText, statementLink: true },
];

export const superAdminMenu = [
  { name: "Dashboard",       path: "/system/dashboard",      icon: LayoutDashboard },
  { name: "Companies",       path: "/system/tenants",        icon: Building2 },
  { name: "Create Company",  path: "/system/create-company", icon: FolderKanban },
];

/* ── COMPONENT ── */

export default function Sidebar({ sidebarOpen, setSidebarOpen, compact, setCompact }) {
  const { user }         = useAuth();
  const { tenantId: urlTenantId } = useParams();
  const tenantId = urlTenantId ?? (user?.tenantSlug || user?.tenantId);

  const isSuperAdmin  = user?.role === "super_admin";
  const isClientRole  = user?.role === "CLIENT";
  const rolePerms     = user?.permissions || [];

  const hasPermission = (perm) =>
    rolePerms.includes("*") || rolePerms.includes(perm);

  const allowedMenu = isSuperAdmin
    ? superAdminMenu
    : isClientRole
    ? clientMenu.filter((item) => hasPermission(item.perm))
    : menu.filter((item) => hasPermission(item.perm));

  const userInitial = (user?.name || "U").charAt(0).toUpperCase();

  return (
    <>
      {/* ── MOBILE OVERLAY ── */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-[100dvh] flex-col bg-[#1e2756] text-white transition-all duration-300 lg:static ${
          compact ? "w-[72px]" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >

        {/* ── HEADER ── */}
        <div
          className={`flex shrink-0 items-center border-b border-white/10 px-4 py-5 ${
            compact ? "justify-center" : "justify-between"
          }`}
        >
          {!compact && (
            isSuperAdmin ? (
              /* Super admin logo mark */
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-indigo-900/40">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300">
                    System Console
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-white truncate">
                    Super Admin
                  </h2>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                {/* Brand logo mark */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/30 ring-1 ring-indigo-400/40">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M3 9L12 3L21 9V21H15V15H9V21H3V9Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M9 15H15V21H9V15Z" fill="currentColor" fillOpacity="0.4"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
                    {isClientRole ? "Client Portal" : "Urbanfeat ERP"}
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-white truncate">
                    {isClientRole ? (user?.name || "My Account") : "Control Panel"}
                  </h2>
                </div>
              </div>
            )
          )}

          {/* Compact mode: logo icon doubles as expand button */}
          {compact && (
            <button
              onClick={() => setCompact(false)}
              title="Expand sidebar"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:opacity-80 ${
                isSuperAdmin
                  ? "bg-gradient-to-br from-violet-500 to-indigo-500"
                  : "bg-indigo-500/30 ring-1 ring-indigo-400/40"
              }`}
            >
              {isSuperAdmin
                ? <ShieldCheck size={18} className="text-white" />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M3 9L12 3L21 9V21H15V15H9V21H3V9Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M9 15H15V21H9V15Z" fill="currentColor" fillOpacity="0.4"/>
                  </svg>
              }
            </button>
          )}

          {!compact && (
            <button
              onClick={() => setCompact(true)}
              title="Collapse sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo-300 transition hover:bg-white/10 hover:text-white"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {/* ── NAVIGATION ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-1">
            {allowedMenu.map((item) => {
              const Icon = item.icon;

              // Statement link for CLIENT users — points to their own client statement page
              if (item.statementLink) {
                const to = user?.clientId
                  ? `/tenant/${tenantId}/clients/${user.clientId}/statement`
                  : null;
                if (!to) return null;
                return (
                  <NavLink
                    key="statement"
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    title={compact ? item.name : undefined}
                    className={({ isActive }) =>
                      `group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        compact ? "justify-center" : "gap-3"
                      } ${
                        isActive
                          ? "bg-white text-[#1e2756] shadow-sm"
                          : "text-indigo-200 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} className={isActive ? "text-[#1e2756]" : "text-indigo-300 group-hover:text-white"} />
                        {!compact && <span>{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                );
              }

              const to = isSuperAdmin
                ? item.path
                : `/tenant/${tenantId}${item.path}`;

              return (
                <NavLink
                  key={item.path}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  title={compact ? item.name : undefined}
                  className={({ isActive }) =>
                    `group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      compact ? "justify-center" : "gap-3"
                    } ${
                      isActive
                        ? "bg-white text-[#1e2756] shadow-sm"
                        : "text-indigo-200 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} className={isActive ? "text-[#1e2756]" : "text-indigo-300 group-hover:text-white"} />
                      {!compact && <span>{item.name}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* ── FOOTER — compact mode shows avatar only as visual anchor ── */}
        {compact && (
          <div
            className="shrink-0 border-t border-white/10 px-3 py-4 flex justify-center"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white ring-2 ring-indigo-400/40">
              {userInitial}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
