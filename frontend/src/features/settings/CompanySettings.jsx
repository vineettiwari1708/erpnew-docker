import { useEffect, useRef, useState } from "react";
import { Upload, ImagePlus, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../store/hooks";
import { clearTenantProfileCache } from "../../store/hooks";
import { getTenantProfileApi, updateTenantProfileApi } from "../../services/api/client.api";
import AddressFields from "../../components/AddressFields";

export default function CompanySettings() {
  const { user } = useAuth();
  const tenantId  = user?.tenantId;
  const fileRef   = useRef(null);

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [form, setForm] = useState({
    name:       "",
    email:      "",
    phone:      "",
    website:    "",
    gstNumber:  "",
    gstEnabled: false,
    line1:      "",
    city:       "",
    state:      "",
    country:    "",
    pincode:    "",
    logoUrl:    "",
  });

  useEffect(() => {
    if (!tenantId) return;
    getTenantProfileApi(tenantId)
      .then((res) => {
        const d = res.data || {};
        setForm({
          name:       d.name       || "",
          email:      d.email      || "",
          phone:      d.phone      || "",
          website:    d.website    || "",
          gstNumber:  d.gstNumber  || "",
          gstEnabled: d.gstEnabled || false,
          line1:      d.address?.line1   || "",
          city:       d.address?.city    || "",
          state:      d.address?.state   || "",
          country:    d.address?.country || "",
          pincode:    d.address?.pincode || "",
          logoUrl:    d.logoUrl    || "",
        });
      })
      .catch(() => toast.error("Failed to load company profile"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Company name is required"); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name",       form.name);
      fd.append("email",      form.email);
      fd.append("phone",      form.phone);
      fd.append("website",    form.website);
      fd.append("gstNumber",  form.gstNumber);
      fd.append("gstEnabled", String(form.gstEnabled));
      fd.append("address", JSON.stringify({
        line1:   form.line1,
        city:    form.city,
        state:   form.state,
        country: form.country,
        pincode: form.pincode,
      }));
      if (logoFile) fd.append("logo", logoFile);

      const res = await updateTenantProfileApi(fd);

      clearTenantProfileCache(tenantId);
      setForm((prev) => ({ ...prev, logoUrl: res.data.logoUrl || prev.logoUrl }));
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Company profile saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(95vh-80px)] items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading company profile...</p>
      </div>
    );
  }

  const currentLogo = logoPreview || form.logoUrl;

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Company Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your company profile, logo, and contact details. These appear on all generated PDFs.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* LOGO SECTION */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Company Logo</h2>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">

            {/* PREVIEW */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              {currentLogo ? (
                <img src={currentLogo} alt="Company logo" className="h-full w-full object-contain p-1" />
              ) : (
                <ImagePlus size={28} className="text-slate-300" />
              )}
            </div>

            {/* UPLOAD */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                {currentLogo ? "Logo uploaded" : "No logo set"}
              </p>
              <p className="text-xs text-slate-400">
                PNG or JPG, max 5 MB. Shown in the top-right corner of all PDF documents.
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
              >
                <Upload size={15} />
                {currentLogo ? "Change Logo" : "Upload Logo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleFile}
              />
              {logoFile && (
                <p className="text-xs text-indigo-600">
                  Selected: {logoFile.name} — will be uploaded on save
                </p>
              )}
            </div>
          </div>
        </div>

        {/* COMPANY INFO */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Company Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name *" value={form.name} onChange={set("name")} placeholder="Acme Pvt Ltd" />
            <Field label="Email"    value={form.email}   onChange={set("email")}   placeholder="billing@acme.com" type="email" />
            <Field label="Phone"    value={form.phone}   onChange={set("phone")}   placeholder="+91 98765 43210" />
            <Field label="Website"  value={form.website} onChange={set("website")} placeholder="https://acme.com" />
          </div>
        </div>

        {/* GST */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">GST Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GSTIN" value={form.gstNumber} onChange={set("gstNumber")} placeholder="22AAAAA0000A1Z5" />
            <div className="flex items-center gap-3 pt-6">
              <input
                id="gstEnabled"
                type="checkbox"
                checked={form.gstEnabled}
                onChange={set("gstEnabled")}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="gstEnabled" className="text-sm font-medium text-slate-700">
                GST enabled on invoices
              </label>
            </div>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Address</h2>
          <AddressFields
            address={{ line1: form.line1, state: form.state, city: form.city, pincode: form.pincode }}
            onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          />
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Check size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
      />
    </div>
  );
}
