import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Copy } from "lucide-react";
import AddressFields from "../../components/AddressFields";
import {
  createTenantApi,
  getTenantByIdApi,
  updateTenantApi,
} from "../../services/api/tenant.api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  gstNumber: "",
  website: "",
  industry: "",
  employees: "",
  description: "",
  plan: "FREE",
  status: "ACTIVE",
  address: {
    line1: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  },
  gstEnabled: true,
  gstType: "REGULAR",
  gstRate: 18,
};

const initialAdmin = {
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  adminPasswordConfirm: "",
};


function validate(form, admin, isEdit) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Company name is required";

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address";

  if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.trim()))
    errors.phone = "Enter a valid 10-digit Indian mobile number";

  if (
    form.gstNumber &&
    !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
      form.gstNumber.trim().toUpperCase()
    )
  )
    errors.gstNumber = "Invalid GST number (e.g. 27ABCDE1234F1Z5)";

  if (form.address.pincode && !/^\d{6}$/.test(form.address.pincode.trim()))
    errors.pincode = "Pincode must be exactly 6 digits";

  if (form.employees && (isNaN(Number(form.employees)) || Number(form.employees) < 0))
    errors.employees = "Enter a valid number of employees";

  if (!isEdit) {
    if (!admin.adminEmail.trim()) errors.adminEmail = "Admin email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.adminEmail.trim()))
      errors.adminEmail = "Enter a valid admin email";

    if (!admin.adminPassword) errors.adminPassword = "Admin password is required";
    else if (admin.adminPassword.length < 6)
      errors.adminPassword = "Password must be at least 6 characters";

    if (admin.adminPassword !== admin.adminPasswordConfirm)
      errors.adminPasswordConfirm = "Passwords do not match";
  }

  return errors;
}


export default function CreateCompany() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]   = useState(initialForm);
  const [admin, setAdmin] = useState(initialAdmin);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError]   = useState("");
  const [created, setCreated] = useState(null); // { tenant, adminUser }
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      setLoadError("");
      try {
        const res = await getTenantByIdApi(id);
        const tenant = res.data;
        setForm({
          ...initialForm,
          ...tenant,
          employees: tenant.employees ?? "",
          address: { ...initialForm.address, ...tenant.address },
        });
      } catch (err) {
        setLoadError(err?.response?.data?.message || err?.message || "Failed to load company data");
      }
    }
    load();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onAddressChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onAdminChange = (e) => {
    const { name, value } = e.target;
    setAdmin((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };


  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate(form, admin, isEdit);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        employees: form.employees ? Number(form.employees) : 0,
        gstNumber: form.gstNumber.trim().toUpperCase(),
        ...(!isEdit && {
          adminName:     admin.adminName.trim() || undefined,
          adminEmail:    admin.adminEmail.trim().toLowerCase(),
          adminPassword: admin.adminPassword,
        }),
      };

      if (isEdit) {
        await updateTenantApi(id, payload);
        setTimeout(() => navigate(`/system/tenants/${id}`), 800);
      } else {
        const res = await createTenantApi(payload);
        setCreated(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!created) return;
    const text = `Company: ${created.tenant.name}\nAdmin Email: ${created.adminUser.email}\nPassword: (set during creation)\nLogin: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── SUCCESS STATE ── */
  if (created) {
    return (
      <section className="flex h-[90dvh] items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">

          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={44} />
            <h2 className="text-lg font-semibold text-slate-900">Company Created!</h2>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium">{created.tenant.name}</span> has been registered and the admin account is ready.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Admin Login Credentials</h3>

            <div className="rounded-xl bg-slate-50 p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Company ID</span>
                <span className="text-slate-800 break-all text-right text-xs">{created.tenant.id}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Admin Name</span>
                <span className="text-slate-800">{created.adminUser.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Admin Email</span>
                <span className="text-slate-800">{created.adminUser.email}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Role</span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs text-indigo-700">
                  {created.adminUser.role?.name || "ADMIN"}
                </span>
              </div>
            </div>

            <button
              onClick={copyCredentials}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy size={15} />
              {copied ? "Copied!" : "Copy Credentials"}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCreated(null); setForm(initialForm); setAdmin(initialAdmin); setFieldErrors({}); }}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Create Another
            </button>
            <Link
              to="/system/tenants"
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View All Companies
            </Link>
          </div>

        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <p className="text-sm text-red-500">{loadError}</p>
        <button onClick={() => window.history.back()} className="text-sm text-indigo-600 hover:underline">
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Edit Company" : "Create Company"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit ? "Update tenant company details" : "Register a new tenant company in the system"}
          </p>
        </div>
        <Link to="/system/tenants" className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6 p-6">

          {/* COMPANY INFO */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Company Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Company Name *" name="name" value={form.name} onChange={onChange} placeholder="Acme Pvt Ltd" error={fieldErrors.name} />
              <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="info@company.com" error={fieldErrors.email} />
              <Input label="Phone" name="phone" value={form.phone} onChange={onChange} placeholder="9876543210" error={fieldErrors.phone} />
              <Input label="Website" name="website" value={form.website} onChange={onChange} placeholder="https://company.com" />
              <Input label="Industry" name="industry" value={form.industry} onChange={onChange} placeholder="e.g. SaaS" />
              <Input label="Employees" name="employees" type="number" min="0" value={form.employees} onChange={onChange} placeholder="100" error={fieldErrors.employees} />
            </div>
          </div>

          {/* TAX & PLAN */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Tax & Plan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="GST Number" name="gstNumber" value={form.gstNumber} onChange={onChange} placeholder="27ABCDE1234F1Z5" error={fieldErrors.gstNumber} />
              <Select label="Plan" name="plan" value={form.plan} onChange={onChange}>
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </Select>
              <Select label="Status" name="status" value={form.status} onChange={onChange}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>
          </div>

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

          {/* DESCRIPTION */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Description</h2>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows="3"
              placeholder="Brief description of the company..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* ADMIN ACCOUNT — only on create */}
          {!isEdit && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h2 className="mb-1 text-sm font-semibold text-indigo-800">Company Admin Account</h2>
              <p className="mb-4 text-xs text-indigo-600">
                These credentials will be used by the company admin to log in to the portal.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Admin Name" name="adminName" value={admin.adminName} onChange={onAdminChange} placeholder="John Doe" />
                <Input label="Admin Email *" name="adminEmail" type="email" value={admin.adminEmail} onChange={onAdminChange} placeholder="admin@company.com" error={fieldErrors.adminEmail} />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Password * <span className="text-[10px] text-slate-400">(min 6 characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      name="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={admin.adminPassword}
                      onChange={onAdminChange}
                      placeholder="••••••••"
                      className={`w-full rounded-lg border px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 ${
                        fieldErrors.adminPassword ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.adminPassword && <p className="text-xs text-red-500">{fieldErrors.adminPassword}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Confirm Password *</label>
                  <input
                    name="adminPasswordConfirm"
                    type={showPassword ? "text" : "password"}
                    value={admin.adminPasswordConfirm}
                    onChange={onAdminChange}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.adminPasswordConfirm ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-indigo-500"
                    }`}
                  />
                  {fieldErrors.adminPasswordConfirm && <p className="text-xs text-red-500">{fieldErrors.adminPasswordConfirm}</p>}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {loading ? "Saving..." : isEdit ? "Update Company" : "Create Company & Admin Account"}
          </button>

        </form>
      </div>
    </section>
  );
}

function Input({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-indigo-500"
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        {...props}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {children}
      </select>
    </div>
  );
}
