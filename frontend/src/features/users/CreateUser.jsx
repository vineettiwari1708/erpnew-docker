import { useEffect, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { CheckCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import AddressFields from "../../components/AddressFields";

import {
  createUserApi,
  getUserByIdApi,
  updateUserApi,
} from "../../services/api/user.api";
import { getRolesApi } from "../../services/api/role.api";
import { useAuth, useTenantPath } from "../../store/hooks";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
  status: "ACTIVE",
  address: { line1: "", city: "", state: "", country: "India", pincode: "" },
};

export default function CreateUser() {
  const tp = useTenantPath();
  const { user: authUser } = useAuth();
  const editMatch = useMatch("/tenant/:tenantId/users/edit/:id");
  const isEdit = Boolean(editMatch);
  const id = editMatch?.params?.id ?? null;

  const [form, setForm]           = useState(initialForm);
  const [roles, setRoles]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  /* success state — holds the created user + plaintext password for display */
  const [createdUser, setCreatedUser] = useState(null);
  const [savedPassword, setSavedPassword] = useState("");

  /* password reset (edit mode) */
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPwd, setConfirmPwd]       = useState("");
  const [showPwd, setShowPwd]             = useState(false);
  const [resetSection, setResetSection]   = useState(false);

  const tenantId = authUser?.tenantId;

  /* ── LOAD ROLES ── */
  useEffect(() => {
    if (!tenantId) return;
    getRolesApi(tenantId)
      .then((data) => {
        const list = (Array.isArray(data) ? data : []).filter((r) => r.name !== "CLIENT");
        setRoles(list);
        if (!isEdit && list.length > 0)
          setForm((prev) => ({ ...prev, roleId: list[0].id }));
      })
      .catch(() => toast.error("Failed to load roles"));
  }, [tenantId]);

  /* ── LOAD USER (edit mode) ── */
  useEffect(() => {
    if (!isEdit || !id) return;
    setPageLoading(true);
    getUserByIdApi(id)
      .then((res) => {
        const u = res.data;
        if (!u) return;
        setForm({
          ...initialForm,
          name:    u.name    || "",
          email:   u.email   || "",
          phone:   u.phone   || "",
          roleId:  u.roleId  || "",
          status:  u.status  || "ACTIVE",
          address: { ...initialForm.address, ...u.address },
        });
      })
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setPageLoading(false));
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onAddressChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
  };

  /* ── SUBMIT ── */
  const onSubmit = async (e) => {
    e.preventDefault();

    /* Validate password reset fields when section is open */
    if (isEdit && resetSection) {
      if (!newPassword) { toast.error("Enter a new password"); return; }
      if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
      if (newPassword !== confirmPwd) { toast.error("Passwords do not match"); return; }
    }

    setLoading(true);
    try {
      if (isEdit) {
        const payload = { ...form, tenantId };
        if (resetSection && newPassword) payload.newPassword = newPassword;
        const res = await updateUserApi(id, payload);
        toast.success(`User "${res.data.name}" updated`);
        if (resetSection) {
          setResetSection(false);
          setNewPassword("");
          setConfirmPwd("");
        }
      } else {
        const plain = form.password;
        const res = await createUserApi({ ...form, tenantId });
        setSavedPassword(plain);
        setCreatedUser(res.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── PAGE LOADING ── */
  if (pageLoading) {
    return (
      <section className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading user...</p>
      </section>
    );
  }

  /* ── SUCCESS SCREEN (after create) ── */
  if (createdUser) {
    const roleName = roles.find((r) => r.id === createdUser.roleId)?.name || createdUser.role?.name || "—";
    return (
      <section className="flex h-[90dvh] items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">

          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={44} />
            <h2 className="text-lg font-semibold text-slate-900">User Created!</h2>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium">{createdUser.name}</span> ({roleName}) has been added.
            </p>
          </div>

          {/* Login credentials to share */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-500">Login Credentials</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-sm font-semibold text-slate-800">{createdUser.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                <span className="text-xs text-slate-500">Password</span>
                <span className="text-sm font-semibold text-slate-800">{savedPassword}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-indigo-500">Share these credentials with the user so they can log in.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { setCreatedUser(null); setSavedPassword(""); setForm(initialForm); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <UserPlus size={18} />
              Create Another User
            </button>
            <Link
              to={tp("/users")}
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-sm text-slate-500 hover:bg-slate-50"
            >
              ← Back to Users
            </Link>
          </div>

        </div>
      </section>
    );
  }

  /* ── FORM ── */
  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Edit User" : "Create User"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit ? "Update user details" : "Add a new staff member"}
          </p>
        </div>
        <Link to={tp("/users")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6 p-6">

          {/* USER INFO */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">User Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Name"     name="name"  value={form.name}  onChange={onChange} required />
              <Input label="Email (Login ID)" type="email" name="email" value={form.email} onChange={onChange} required />
              <Input label="Phone"         name="phone" value={form.phone} onChange={onChange} />

              {/* Password — only on create */}
              {!isEdit && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      required
                      placeholder="Min 6 characters"
                      className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROLE + STATUS */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Role & Status</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Role</label>
                <Select name="roleId" value={form.roleId} onChange={onChange}>
                  {roles.length === 0 && <option value="">Loading roles...</option>}
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Select name="status" value={form.status} onChange={onChange}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
            </div>
          </div>

          {/* PASSWORD RESET — edit mode only */}
          {isEdit && (
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Reset Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Set a new password for this user</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={resetSection}
                    onChange={(e) => {
                      setResetSection(e.target.checked);
                      if (!e.target.checked) { setNewPassword(""); setConfirmPwd(""); }
                    }}
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              {resetSection && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">New Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Confirm Password <span className="text-red-500">*</span></label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADDRESS */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Address</h2>
            <AddressFields
              address={form.address}
              onChange={(field, value) =>
                setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
          </button>

        </form>
      </div>
    </section>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
    >
      {children}
    </select>
  );
}
