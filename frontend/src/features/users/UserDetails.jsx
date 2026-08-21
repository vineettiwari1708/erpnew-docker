import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getUserByIdApi, updateUserApi, deleteUserApi } from "../../services/api/user.api";
import { useAuth, useTenantPath } from "../../store/hooks";
import {
  Mail, Phone, Shield, User, MapPin, Edit, Trash2, AlertTriangle, X,
} from "lucide-react";

export default function UserDetails() {
  const tp         = useTenantPath();
  const navigate   = useNavigate();
  const { user: authUser } = useAuth();
  const { id }     = useParams();

  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [toggling, setToggling]             = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]             = useState(false);

  const tenantId = authUser?.tenantId;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await getUserByIdApi(id);
        setUser(res.data || null);
      } catch (err) {
        console.error("Failed to load user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleStatus = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateUserApi(user.id, { status: newStatus });
      setUser((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUserApi(user.id);
      navigate(tp("/users"));
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(95vh-80px)] items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[calc(95vh-80px)] flex-col items-center justify-center gap-3">
        <AlertTriangle className="text-red-400" size={36} />
        <p className="text-slate-600">User not found</p>
        <Link to={tp("/users")} className="text-sm text-indigo-600 hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }

  const isActive  = user.status === "ACTIVE";
  const roleName  = user.role?.name ?? user.role ?? "—";

  const actionBtn =
    "flex flex-col items-center justify-center rounded-xl border bg-slate-50 p-3 hover:bg-slate-100 hover:shadow-md transition";

  const address = user.address
    ? `${user.address.line1 ?? ""}, ${user.address.city ?? ""}, ${user.address.state ?? ""}, ${user.address.country ?? ""} - ${user.address.pincode ?? ""}`
    : "No address available";

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">User Full Profile</p>
        </div>
        <Link to={tp("/users")} className="text-sm text-indigo-600 hover:underline">
          ← Back
        </Link>
      </div>

      {/* TOP GRID */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* USER INFO */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
              {user.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              <span>{user.phone || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-slate-400" />
              <span>{roleName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${isActive ? "bg-green-500" : "bg-slate-400"}`} />
              <span className={`font-medium ${isActive ? "text-green-600" : "text-slate-500"}`}>
                {user.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs">Department:</span>
              <span className="font-medium text-slate-700">{user.department || "—"}</span>
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Overview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between rounded-xl bg-slate-50 p-3">
              <span>User ID</span>
              <span className="font-semibold text-slate-700 truncate ml-2">{user.id}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-indigo-50 p-3">
              <span>Role</span>
              <span className="font-semibold text-indigo-700">{roleName}</span>
            </div>
            <div className={`flex justify-between rounded-xl p-3 ${isActive ? "bg-green-50" : "bg-slate-50"}`}>
              <span>Status</span>
              <span className={`font-semibold ${isActive ? "text-green-700" : "text-slate-500"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex justify-between rounded-xl bg-yellow-50 p-3">
              <span>Tenant</span>
              <span className="font-semibold text-yellow-700">{tenantId}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Actions</h3>

          {/* STATUS TOGGLE */}
          <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
            isActive ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
          }`}>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                {isActive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                )}
                <span className={`relative inline-flex h-3 w-3 rounded-full ${isActive ? "bg-green-500" : "bg-slate-400"}`} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{isActive ? "Active" : "Inactive"}</p>
                <p className="text-xs text-slate-500">
                  {isActive ? "User account is active" : "User account is suspended"}
                </p>
              </div>
            </div>

            <button
              onClick={toggleStatus}
              disabled={toggling}
              role="switch"
              aria-checked={isActive}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 ${
                isActive ? "bg-green-500" : "bg-slate-300"
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-3">
            <Link to={tp(`/users/edit/${user.id}`)} className={actionBtn}>
              <Edit className="text-indigo-600" size={20} />
              <span className="mt-1 text-xs">Edit</span>
            </Link>
            <Link to={tp("/users")} className={actionBtn}>
              <User className="text-green-600" size={20} />
              <span className="mt-1 text-xs">All Users</span>
            </Link>
          </div>

          {/* DANGER ZONE */}
          <div className="mt-4 border-t pt-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 size={16} />
              Delete User
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Delete User</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600">
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
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
