import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { CheckCircle, FolderPlus, UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import AddressFields from "../../components/AddressFields";

import {
  createClientApi,
  getClientByIdApi,
  updateClientApi,
} from "../../services/api/client.api";
import { useAuth, useTenantPath } from "../../store/hooks";

const PREFIXES = ["", "Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];

const initialForm = {
  prefix: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  industry: "",
  website: "",
  status: "ACTIVE",
  address: {
    line1: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  },
  description: "",
};

export default function CreateClient() {
  const tp = useTenantPath();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editMatch = useMatch("/tenant/:tenantId/clients/edit/:id");
  const isEdit = Boolean(editMatch);
  const id = editMatch?.params?.id ?? null;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState(null);

  /* Portal access state */
  const [enablePortal, setEnablePortal] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalConfirm, setPortalConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const tenantId = user?.tenantId;

  useEffect(() => {
    if (!isEdit || !id) return;
    const loadClient = async () => {
      try {
        setPageLoading(true);
        const res = await getClientByIdApi(id);
        const client = res.data;
        if (!client) return;
        setForm({
          ...initialForm,
          prefix: client.prefix || "",
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          company: client.company || "",
          industry: client.industry || "",
          website: client.website || "",
          status: client.status || "ACTIVE",
          address: { ...initialForm.address, ...client.address },
          description: client.description || "",
        });
      } catch (err) {
        console.error("LOAD CLIENT ERROR:", err);
        toast.error("Failed to load client");
      } finally {
        setPageLoading(false);
      }
    };
    loadClient();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onAddressChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const nameVal = form.name.trim();
    if (!nameVal) { toast.error("Client name is required"); return; }
    if (nameVal.length < 3) { toast.error("Client name must be at least 3 characters"); return; }

    if (form.email) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(form.email.trim())) { toast.error("Enter a valid email address"); return; }
    }

    if (form.phone) {
      const digits = form.phone.replace(/\D/g, "").replace(/^91/, "");
      if (digits.length !== 10) { toast.error("Phone number must be 10 digits"); return; }
    }

    if (!isEdit && enablePortal) {
      if (!portalEmail) { toast.error("Portal email is required"); return; }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(portalEmail.trim())) { toast.error("Enter a valid portal email address"); return; }
      if (!portalPassword) { toast.error("Portal password is required"); return; }
      if (portalPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
      if (portalPassword !== portalConfirm) { toast.error("Passwords do not match"); return; }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        tenantId,
        ...(enablePortal && !isEdit ? { portalEmail, portalPassword } : {}),
      };
      if (isEdit) {
        const res = await updateClientApi(id, payload);
        toast.success(`Client "${res.data.name}" updated successfully`);
        navigate(tp("/clients"));
      } else {
        const res = await createClientApi(payload);
        toast.success(`Client "${res.data.name}" created successfully`);
        setCreatedClient(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <section className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading client...</p>
      </section>
    );
  }

  /* ── SUCCESS STATE ── */
  if (createdClient) {
    return (
      <section className="flex h-[90dvh] items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">

          {/* success card */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={44} />
            <h2 className="text-lg font-semibold text-slate-900">Client Created!</h2>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium">{createdClient.name}</span> has been added successfully.
            </p>
          </div>

          {/* portal credentials — shown only if portal was set up */}
          {createdClient.portalCreated && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-500">Client Portal Login</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border">
                  <span className="text-xs text-slate-500">Email</span>
                  <span className="text-sm font-semibold text-slate-800">{createdClient.portalEmail}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border">
                  <span className="text-xs text-slate-500">Password</span>
                  <span className="text-sm font-semibold text-slate-800">{portalPassword}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-indigo-500">Share these credentials with the client.</p>
            </div>
          )}

          {/* action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(tp(`/projects/create?clientId=${createdClient.id}&clientName=${encodeURIComponent(createdClient.name)}`))}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FolderPlus size={18} />
              Create Project for this Client
            </button>

            <button
              onClick={() => { setCreatedClient(null); setForm(initialForm); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus size={18} />
              Create Another Client
            </button>

            <Link
              to={tp("/clients")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm text-slate-500 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Clients
            </Link>
          </div>

        </div>
      </section>
    );
  }

  /* ── FORM ── */
  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Edit Client" : "Create Client"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit ? "Update client information" : "Add a new client to the system"}
          </p>
        </div>
        <Link to={tp("/clients")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6 p-6">

          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Client Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Prefix + Name — same row, prefix narrow */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Name <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select
                    name="prefix"
                    value={form.prefix}
                    onChange={onChange}
                    className="w-24 shrink-0 rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {PREFIXES.map((p) => (
                      <option key={p} value={p}>{p || "—"}</option>
                    ))}
                  </select>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    placeholder="Client full name"
                    className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <Input label="Email"    name="email"    value={form.email}    onChange={onChange} />
              <Input label="Phone"    name="phone"    value={form.phone}    onChange={onChange} />
              <Input label="Company"  name="company"  value={form.company}  onChange={onChange} />
              <Input label="Industry" name="industry" value={form.industry} onChange={onChange} />
              <Input label="Website"  name="website"  value={form.website}  onChange={onChange} />
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Status</h2>
            <Select name="status" value={form.status} onChange={onChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Address</h2>
            <AddressFields
              address={form.address}
              onChange={(field, value) =>
                setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }))
              }
            />
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Description</h2>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows="4"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* CLIENT PORTAL ACCESS — only on create */}
          {!isEdit && (
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Client Portal Access</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Allow this client to log in and view their invoices & payments</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={enablePortal}
                    onChange={(e) => {
                      setEnablePortal(e.target.checked);
                      if (e.target.checked && !portalEmail) setPortalEmail(form.email);
                    }}
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              {enablePortal && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Portal Login Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      placeholder="client@example.com"
                      required={enablePortal}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={portalPassword}
                        onChange={(e) => setPortalPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required={enablePortal}
                        className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Confirm Password <span className="text-red-500">*</span></label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={portalConfirm}
                      onChange={(e) => setPortalConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      required={enablePortal}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isEdit ? "Update Client" : "Create Client"}
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
