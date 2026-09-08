import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fullClientName } from "../../utils/clientName";
import { Eye, EyeOff, KeyRound, UserPlus } from "lucide-react";
import {
  getClientByIdApi,
  updateClientApi,
  deleteClientApi,
  resetClientPortalPasswordApi,
  createClientPortalUserApi,
} from "../../services/api/client.api";
import { useTenantPath, useAuth } from "../../store/hooks";
import {
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Wallet,
  AlertTriangle,
  X,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  IndianRupee,
} from "lucide-react";

export default function ClientDetails() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const { id } = useParams();

  const tenantId = user?.tenantId;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* portal reset modal */
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPwd, setResetPwd]             = useState("");
  const [resetConfirm, setResetConfirm]     = useState("");
  const [showResetPwd, setShowResetPwd]     = useState(false);
  const [resetLoading, setResetLoading]     = useState(false);

  /* create portal account modal */
  const [showCreatePortal, setShowCreatePortal] = useState(false);
  const [portalEmail, setPortalEmail]           = useState("");
  const [portalPwd, setPortalPwd]               = useState("");
  const [portalPwdConfirm, setPortalPwdConfirm] = useState("");
  const [showPortalPwd, setShowPortalPwd]       = useState(false);
  const [portalLoading, setPortalLoading]       = useState(false);

  useEffect(() => {
    if (!tenantId || !id) return;
    setLoading(true);
    getClientByIdApi(id)
      .then((res) => setClient(res.data || null))
      .catch(() => toast.error("Failed to load client"))
      .finally(() => setLoading(false));
  }, [tenantId, id]);

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const newStatus = client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateClientApi(client.id, { tenantId, status: newStatus });
      setClient((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Client ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const handlePortalReset = async () => {
    if (!resetPwd) { toast.error("Enter a new password"); return; }
    if (resetPwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (resetPwd !== resetConfirm) { toast.error("Passwords do not match"); return; }
    setResetLoading(true);
    try {
      const res = await resetClientPortalPasswordApi(client.id, resetPwd);
      toast.success(`Portal password reset for ${res.data.email}`);
      setShowResetModal(false);
      setResetPwd("");
      setResetConfirm("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reset portal password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCreatePortal = async () => {
    if (!portalEmail) { toast.error("Enter an email address"); return; }
    if (portalPwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (portalPwd !== portalPwdConfirm) { toast.error("Passwords do not match"); return; }
    setPortalLoading(true);
    try {
      await createClientPortalUserApi(client.id, { email: portalEmail, password: portalPwd });
      toast.success("Portal account created successfully");
      setClient((prev) => ({ ...prev, portalUser: { email: portalEmail } }));
      setShowCreatePortal(false);
      setPortalEmail(""); setPortalPwd(""); setPortalPwdConfirm("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create portal account");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(95vh-80px)] items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-[calc(95vh-80px)] flex-col items-center justify-center gap-3">
        <AlertTriangle className="text-red-400" size={36} />
        <p className="text-slate-600">Client not found</p>
        <Link to={tp("/clients")} className="text-sm text-indigo-600 hover:underline">
          ← Back to Clients
        </Link>
      </div>
    );
  }

  const isActive = client.status === "ACTIVE";

  const actionBtn =
    "flex flex-col items-center justify-center rounded-xl border bg-slate-50 p-3 hover:bg-slate-100 hover:shadow-md transition";

  const address = client.address
    ? `${client.address.line1}, ${client.address.city}, ${client.address.state}, ${client.address.country} - ${client.address.pincode}`
    : "No address available";

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{fullClientName(client)}</h1>
          <p className="text-sm text-slate-500">
            {client.clientNumber && <span className="font-mono text-indigo-600 mr-2">{client.clientNumber}</span>}
            Client Full Profile
          </p>
        </div>
        <Link to={tp("/clients")} className="text-sm text-indigo-600 hover:underline">
          ← Back
        </Link>
      </div>

      {/* AMOUNT PANEL */}
      {client.financials && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AmountCard
            icon={<IndianRupee size={18} />}
            label="Total Billed"
            value={client.financials.totalBilled}
            color="indigo"
          />
          <AmountCard
            icon={<CheckCircle2 size={18} />}
            label="Total Paid"
            value={client.financials.totalPaid}
            color="green"
          />
          <AmountCard
            icon={<Clock size={18} />}
            label="Outstanding"
            value={client.financials.outstanding}
            color={client.financials.outstanding > 0 ? "red" : "slate"}
          />
          <AmountCard
            icon={<TrendingUp size={18} />}
            label="Invoices"
            value={null}
            color="blue"
            extra={
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                <span>{client.financials.invoiceCount} total</span>
                <span className="text-green-600">{client.financials.paidCount} paid</span>
                {client.financials.overdueCount > 0 && (
                  <span className="text-red-500">{client.financials.overdueCount} overdue</span>
                )}
              </div>
            }
          />
        </div>
      )}

      {/* TOP GRID */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* CLIENT INFO */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
              {client.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{fullClientName(client)}</h2>
              <p className="text-sm text-slate-500">{client.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <span>{client.company || "No company"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              <span>{address}</span>
            </div>

            {/* STATUS DOT */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  isActive ? "bg-green-500" : "bg-slate-400"
                }`}
              />
              <span className={`font-medium ${isActive ? "text-green-600" : "text-slate-500"}`}>
                {client.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs">Created by:</span>
              <span className="font-medium text-slate-700">{client.createdBy || "—"}</span>
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Overview</h3>
          <div className="space-y-3 text-sm">
            <StatRow label="Total Projects" value={client._count?.projects ?? 0} />
            <StatRow label="Total Invoices" value={client._count?.invoices ?? 0} color="text-blue-700" bg="bg-blue-50" />
            <StatRow label="Total Payments" value={client._count?.payments ?? 0} color="text-purple-700" bg="bg-purple-50" />
            {client.financials && (
              <StatRow
                label="Balance Due"
                value={`₹${client.financials.outstanding.toLocaleString("en-IN")}`}
                color={client.financials.outstanding > 0 ? "text-red-700" : "text-green-700"}
                bg={client.financials.outstanding > 0 ? "bg-red-50" : "bg-green-50"}
              />
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Actions</h3>

          {/* STATUS TOGGLE */}
          <div
            className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
              isActive ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
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
                  {isActive ? "Client is active" : "Client is suspended"}
                </p>
              </div>
            </div>

            {/* iOS toggle */}
            <button
              onClick={toggleStatus}
              disabled={toggling}
              role="switch"
              aria-checked={isActive}
              title={isActive ? "Click to deactivate" : "Click to activate"}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 ${
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

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-3">
            <Link to={tp(`/clients/edit/${client.id}`)} className={actionBtn}>
              <Edit className="text-indigo-600" size={20} />
              <span className="mt-1 text-xs">Edit</span>
            </Link>
            <Link to={tp(`/clients/${client.id}/statement`)} className={actionBtn}>
              <BarChart3 className="text-indigo-500" size={20} />
              <span className="mt-1 text-xs">Statement</span>
            </Link>
            <Link to={tp(`/invoices/client?clientId=${client.id}`)} className={actionBtn}>
              <FileText className="text-green-600" size={20} />
              <span className="mt-1 text-xs">Invoices</span>
            </Link>
            <Link to={tp(`/payments/client?clientId=${client.id}`)} className={actionBtn}>
              <Wallet className="text-purple-600" size={20} />
              <span className="mt-1 text-xs">Payments</span>
            </Link>
          </div>

          {/* PORTAL ACCOUNT */}
          <div className="mt-3 space-y-2">
            {client.portalUser ? (
              <>
                <p className="text-xs text-slate-500 text-center">
                  Portal: <span className="font-medium text-slate-700">{client.portalUser.email}</span>
                </p>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                >
                  <KeyRound size={16} />
                  Reset Portal Password
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowCreatePortal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-100"
              >
                <UserPlus size={16} />
                Create Portal Account
              </button>
            )}
          </div>

          {/* DANGER ZONE */}
          <div className="mt-3 border-t pt-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 size={16} />
              Delete Client
            </button>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-800">Client Description</h3>
        <p className="text-sm text-slate-600">
          {client.description || "No description available"}
        </p>
      </div>

      {/* CREATE PORTAL ACCOUNT MODAL */}
      {showCreatePortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Create Portal Account</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Give <strong>{fullClientName(client)}</strong> login access to the client portal.
                </p>
              </div>
              <button onClick={() => { setShowCreatePortal(false); setPortalEmail(""); setPortalPwd(""); setPortalPwdConfirm(""); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Login Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPortalPwd ? "text" : "password"}
                    value={portalPwd}
                    onChange={(e) => setPortalPwd(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <button type="button" onClick={() => setShowPortalPwd(!showPortalPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPortalPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type={showPortalPwd ? "text" : "password"}
                  value={portalPwdConfirm}
                  onChange={(e) => setPortalPwdConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => { setShowCreatePortal(false); setPortalEmail(""); setPortalPwd(""); setPortalPwdConfirm(""); }} className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleCreatePortal} disabled={portalLoading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                {portalLoading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Reset Portal Password</h3>
                <p className="mt-1 text-sm text-slate-500">Set a new password for <strong>{fullClientName(client)}</strong>'s client portal login.</p>
              </div>
              <button onClick={() => { setShowResetModal(false); setResetPwd(""); setResetConfirm(""); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showResetPwd ? "text" : "password"}
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowResetPwd(!showResetPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showResetPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type={showResetPwd ? "text" : "password"}
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => { setShowResetModal(false); setResetPwd(""); setResetConfirm(""); }} className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handlePortalReset} disabled={resetLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Delete Client</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Are you sure you want to delete <strong>{fullClientName(client)}</strong>? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
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

const colorMap = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", label: "text-indigo-500", value: "text-indigo-800", border: "border-indigo-100" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  label: "text-green-500",  value: "text-green-800",  border: "border-green-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-500",    label: "text-red-400",    value: "text-red-700",    border: "border-red-100" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   label: "text-blue-500",   value: "text-blue-800",   border: "border-blue-100" },
  slate:  { bg: "bg-slate-50",  icon: "text-slate-500",  label: "text-slate-400",  value: "text-slate-700",  border: "border-slate-100" },
};

function AmountCard({ icon, label, value, color = "indigo", extra }) {
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 shadow-sm`}>
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ${c.icon}`}>
        {icon}
      </div>
      <p className={`text-xs font-medium uppercase tracking-wide ${c.label}`}>{label}</p>
      {value !== null ? (
        <p className={`mt-1 text-xl font-bold tabular-nums ${c.value}`}>
          ₹{value.toLocaleString("en-IN")}
        </p>
      ) : (
        extra
      )}
      {value !== null && extra}
    </div>
  );
}