import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Lock, Mail, ShieldCheck, KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import http from "../../services/api/http";
import { updateProfile } from "../../store/slices/authSlice";

async function getProfileApi()       { return { data: (await http.get("/system/profile")).data }; }
async function updateProfileApi(d)   { return { data: (await http.put("/system/profile", d)).data }; }

export default function SuperAdminProfile() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({ name: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getProfileApi()
      .then((res) => {
        setProfile(res.data);
        setForm({ name: res.data.name || "" });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const set    = (f) => (e) => setForm((p)   => ({ ...p, [f]: e.target.value }));
  const setPw  = (f) => (e) => setPwForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim() };

      if (pwForm.newPassword) {
        if (!pwForm.currentPassword) { toast.error("Enter your current password"); setSaving(false); return; }
        if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("New passwords do not match"); setSaving(false); return; }
        if (pwForm.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); setSaving(false); return; }
        payload.currentPassword = pwForm.currentPassword;
        payload.newPassword     = pwForm.newPassword;
      }

      const res = await updateProfileApi(payload);
      setProfile((p) => ({ ...p, ...res.data }));
      setForm({ name: res.data.name || form.name });
      dispatch(updateProfile({ name: res.data.name || form.name.trim() }));
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-[calc(95vh-80px)] items-center justify-center">
      <p className="animate-pulse text-slate-500">Loading profile...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="flex h-[calc(95vh-80px)] flex-col items-center justify-center gap-3">
      <AlertCircle size={36} className="text-red-400" />
      <p className="text-slate-600">{error || "Profile not found"}</p>
    </div>
  );

  const initial = (profile.name || "S").charAt(0).toUpperCase();

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2 pb-10">

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Update your super admin name and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT — identity card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-100">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-3xl font-bold text-white ring-4 ring-violet-100">
              {initial}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <ShieldCheck size={11} />
              Super Admin
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <InfoRow icon={<Mail size={14} />} label="Email">
              <span className="truncate">{profile.email}</span>
            </InfoRow>
            <InfoRow icon={<ShieldCheck size={14} />} label="Role">
              Super Admin
            </InfoRow>
            <InfoRow icon={<KeyRound size={14} />} label="Since">
              {new Date(profile.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </InfoRow>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            <Lock size={13} className="mt-0.5 shrink-0" />
            <span>Email cannot be changed. Contact system support if needed.</span>
          </div>
        </div>

        {/* RIGHT — edit form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSave} className="rounded-2xl border bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-800">Edit Details</h2>
              <p className="mt-0.5 text-xs text-slate-400">Update your name or change your password.</p>
            </div>

            <div className="space-y-5 p-6">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {/* Email — locked */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Email (read-only)</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                  <Lock size={12} className="shrink-0 text-slate-300" />
                  <span className="truncate">{profile.email}</span>
                </div>
              </div>

              {/* Password change section */}
              <div className="border-t border-slate-100 pt-5">
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">Change Password (optional)</p>

                <div className="space-y-4">
                  <PasswordField
                    label="Current Password"
                    value={pwForm.currentPassword}
                    onChange={setPw("currentPassword")}
                    show={showCurrent}
                    onToggle={() => setShowCurrent((v) => !v)}
                    placeholder="Your current password"
                  />
                  <PasswordField
                    label="New Password"
                    value={pwForm.newPassword}
                    onChange={setPw("newPassword")}
                    show={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                    placeholder="At least 6 characters"
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={pwForm.confirmPassword}
                    onChange={setPw("confirmPassword")}
                    show={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition"
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

function PasswordField({ label, value, onChange, show, onToggle, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
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
