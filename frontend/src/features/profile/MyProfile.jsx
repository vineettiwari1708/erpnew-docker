import { useEffect, useState } from "react";
import { Lock, Mail, ShieldCheck, Phone, Briefcase, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getMyProfileApi, updateMyProfileApi } from "../../services/api/user.api";

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ name: "", phone: "", department: "" });

  useEffect(() => {
    getMyProfileApi()
      .then((res) => {
        const d = res.data;
        setProfile(d);
        setForm({ name: d.name || "", phone: d.phone || "", department: d.department || "" });
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load profile");
        toast.error("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await updateMyProfileApi(form);
      setProfile((prev) => ({ ...prev, ...res.data }));
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(95vh-80px)] items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-[calc(95vh-80px)] flex-col items-center justify-center gap-3">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-slate-600">{error || "Profile not found"}</p>
      </div>
    );
  }

  const initial  = (profile.name || "U").charAt(0).toUpperCase();
  const roleName = profile.role?.name || profile.role || "—";

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your personal details. Email, password, and role can only be changed by an administrator.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── LEFT CARD — identity ── */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-100">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-700 ring-4 ring-indigo-50">
              {initial}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 capitalize">
              {roleName}
            </span>
          </div>

          {/* Info rows */}
          <div className="mt-5 space-y-3">
            <InfoRow icon={<Mail size={14} />} label="Email">
              <span className="truncate">{profile.email}</span>
            </InfoRow>
            <InfoRow icon={<ShieldCheck size={14} />} label="Role">
              <span className="capitalize">{roleName}</span>
            </InfoRow>
            <InfoRow icon={<Phone size={14} />} label="Phone">
              {profile.phone || <span className="text-slate-300 italic">Not set</span>}
            </InfoRow>
            <InfoRow icon={<Briefcase size={14} />} label="Dept.">
              {profile.department || <span className="text-slate-300 italic">Not set</span>}
            </InfoRow>
          </div>

          {/* Admin-only note */}
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            <Lock size={13} className="mt-0.5 shrink-0" />
            <span>Email, password &amp; role can only be changed by an administrator.</span>
          </div>
        </div>

        {/* ── RIGHT — edit form ── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="rounded-2xl border bg-white shadow-sm">

            {/* Form header */}
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-800">Edit Your Details</h2>
              <p className="mt-0.5 text-xs text-slate-400">Only name, phone, and department can be changed here.</p>
            </div>

            <div className="space-y-5 p-6">
              {/* Editable fields */}
              <Field
                label="Full Name"
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Your full name"
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+91 98765 43210"
              />
              <Field
                label="Department"
                value={form.department}
                onChange={set("department")}
                placeholder="e.g. Finance, Operations, Sales"
              />

              {/* Divider */}
              <div className="border-t border-slate-100 pt-5">
                <p className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Read-only (admin controlled)
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LockedField label="Email" value={profile.email} />
                  <LockedField label="Role"  value={roleName} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ── Helpers ── */

function Field({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function LockedField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
        <Lock size={12} className="shrink-0 text-slate-300" />
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-slate-300 shrink-0">{icon}</span>
      <span className="w-10 shrink-0 text-xs text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 truncate min-w-0">{children}</span>
    </div>
  );
}
