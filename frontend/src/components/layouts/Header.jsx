import { useEffect, useRef, useState } from "react";
import {
  Bell, BellDot, CheckCheck, UserCircle, ChevronDown, Settings, LogOut, ShieldCheck,
  Building2, AlertTriangle, XCircle, CheckCircle, Info,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  getSystemNotificationsApi,
} from "../../services/api/notification.api";

const TYPE_CONFIG = {
  INFO:    { icon: Info,          bg: "bg-blue-50",   icon_color: "text-blue-500",   dot: "bg-blue-500"   },
  SUCCESS: { icon: CheckCircle,   bg: "bg-green-50",  icon_color: "text-green-500",  dot: "bg-green-500"  },
  WARNING: { icon: AlertTriangle, bg: "bg-amber-50",  icon_color: "text-amber-500",  dot: "bg-amber-500"  },
  ERROR:   { icon: XCircle,       bg: "bg-red-50",    icon_color: "text-red-500",    dot: "bg-red-500"    },
};

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

export default function Header({ setSidebarOpen }) {
  const { user } = useAuth();
  const { tenantId: urlTenantId } = useParams();
  const tenantSlugOrId = urlTenantId ?? (tenantSlugOrId);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [open, setOpen]                   = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  /* super admin tracks read IDs in-session only (no backend persistence) */
  const [sysReadIds, setSysReadIds]       = useState(new Set());
  const panelRef   = useRef(null);
  const profileRef = useRef(null);

  const isSuperAdmin = user?.role === "super_admin";
  const isTenantUser = user && !isSuperAdmin;

  /* Notifications with read flag merged in for super admin */
  const displayNotifications = isSuperAdmin
    ? notifications.map((n) => ({ ...n, read: sysReadIds.has(n.id) }))
    : notifications;

  const unread = displayNotifications.filter((n) => !n.read).length;

  /* ── FETCH notifications ── */
  const fetchNotifications = () => {
    if (isTenantUser) {
      getNotificationsApi()
        .then((res) => setNotifications(res.data || []))
        .catch(() => {});
    } else if (isSuperAdmin) {
      getSystemNotificationsApi()
        .then((res) => setNotifications(res.data || []))
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(timer);
  }, [isTenantUser, isSuperAdmin]);

  /* ── Close panels on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current   && !panelRef.current.contains(e.target))   setOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Mark read ── */
  const handleMarkRead = async (id) => {
    if (isSuperAdmin) {
      setSysReadIds((prev) => new Set([...prev, id]));
    } else {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      await markNotificationReadApi(id).catch(() => {});
    }
  };

  const handleMarkAll = async () => {
    if (isSuperAdmin) {
      setSysReadIds(new Set(notifications.map((n) => n.id)));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await markAllNotificationsReadApi().catch(() => {});
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-3">

        {/* LEFT — mobile menu + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </button>

          {isSuperAdmin ? (
            /* Super admin brand mark in header */
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <div>
                <h3 className="m-0 text-sm font-bold text-slate-900 leading-tight">System Console</h3>
                <p className="text-[10px] text-slate-400 leading-tight">Super Admin</p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="m-0 text-base font-semibold text-slate-900">ERP SaaS</h3>
              <p className="text-xs text-slate-500">Operations workspace</p>
            </div>
          )}
        </div>

        {/* RIGHT — notifications + profile */}
        <div className="flex items-center gap-4">

          {/* NOTIFICATION BELL — shown for all logged-in users */}
          {user && (
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
                className="relative rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              >
                {unread > 0 ? <BellDot size={20} className="text-indigo-600" /> : <Bell size={20} />}
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 top-10 z-50 w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                    <div className="flex items-center gap-2">
                      {isSuperAdmin
                        ? <ShieldCheck size={14} className="text-violet-500" />
                        : <Bell size={14} className="text-indigo-500" />
                      }
                      <p className="text-sm font-semibold text-slate-800">
                        {isSuperAdmin ? "System Activity" : "Notifications"}
                      </p>
                      {unread > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                          {unread}
                        </span>
                      )}
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={handleMarkAll}
                        className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        <CheckCheck size={12} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[22rem] overflow-y-auto divide-y divide-slate-100">
                    {displayNotifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10">
                        <Bell size={28} className="text-slate-200" />
                        <p className="text-sm text-slate-400">All caught up</p>
                      </div>
                    ) : (
                      displayNotifications.slice(0, 20).map((n) => {
                        const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={n.id}
                            onClick={() => !n.read && handleMarkRead(n.id)}
                            className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 ${
                              !n.read ? "bg-indigo-50/40" : ""
                            }`}
                          >
                            {/* Type icon */}
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                              <Icon size={15} className={cfg.icon_color} />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{n.message}</p>
                              <p className="mt-1 text-[10px] font-medium text-slate-400">{relativeTime(n.createdAt)}</p>
                            </div>

                            {/* Unread dot */}
                            {!n.read && (
                              <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* USER AVATAR + PROFILE DROPDOWN */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 cursor-pointer"
              >
                {isSuperAdmin ? (
                  /* Super admin avatar — distinct purple gradient */
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                    {(user?.name || "S").charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name || "Guest"}</p>
                  <p className="text-xs text-slate-400 capitalize leading-tight">
                    {isSuperAdmin ? "Super Admin" : (user?.role?.name || user?.role || "N/A")}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                  {/* Name / email header */}
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isSuperAdmin ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                          {(user?.name || "S").charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {(user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        <ShieldCheck size={9} />
                        Super Admin
                      </span>
                    )}
                  </div>

                  {/* Super admin links */}
                  {isSuperAdmin && (
                    <>
                      <Link
                        to="/system/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <UserCircle size={15} className="text-violet-500" />
                        My Profile
                      </Link>
                      <Link
                        to="/system/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Settings size={15} className="text-slate-400" />
                        Platform Settings
                      </Link>
                    </>
                  )}

                  {/* Tenant user links */}
                  {isTenantUser && (
                    <>
                      <Link
                        to={`/tenant/${tenantSlugOrId}/my-profile`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <UserCircle size={15} className="text-indigo-500" />
                        My Profile
                      </Link>
                      {(user?.permissions?.includes("ROLE_MANAGE") || user?.permissions?.includes("*")) && (
                        <Link
                          to={`/tenant/${tenantSlugOrId}/settings`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Settings size={15} className="text-slate-400" />
                          Company Settings
                        </Link>
                      )}
                    </>
                  )}

                  {/* Logout — for all */}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
