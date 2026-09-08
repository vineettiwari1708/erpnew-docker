import { useEffect, useRef, useState } from "react";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, FilePlus, FolderPlus, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import {
  createProjectApi,
  getProjectByIdApi,
  updateProjectApi,
} from "../../services/api/project.api";
import { getClientsApi } from "../../services/api/client.api";
import { useAuth, useTenantPath } from "../../store/hooks";

const initialForm = {
  name: "",
  code: "",
  clientId: "",
  status: "PLANNING",
  priority: "MEDIUM",
  type: "",
  budget: "",
  spent: "",
  startDate: "",
  endDate: "",
  projectManager: "",
  description: "",
};

export default function CreateProject() {
  const tp = useTenantPath();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const editMatch = useMatch("/tenant/:tenantId/projects/edit/:id");
  const isEdit = Boolean(editMatch);
  const id = editMatch?.params?.id ?? null;

  // pre-fill clientId when coming from "Create Project for this Client" button
  const prefillClientId   = searchParams.get("clientId")   || "";
  const prefillClientName = searchParams.get("clientName")  || "";

  const [form, setForm] = useState({ ...initialForm, clientId: prefillClientId });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdProject, setCreatedProject] = useState(null);
  const codeEdited = useRef(false); // true once the user manually types in the code field

  const tenantId = user?.tenantId;

  function generateCode(name) {
    const year = new Date().getFullYear();
    const initials = name
      .split(/[\s\-_/]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
    return initials ? `${initials}-${year}-001` : "";
  }

  /* ── load clients for dropdown ── */
  useEffect(() => {
    if (!tenantId) return;
    getClientsApi(tenantId)
      .then((res) => setClients((res.data || []).filter((c) => c.status === "ACTIVE")))
      .catch(() => {});
  }, [tenantId]);

  /* ── load project when editing ── */
  useEffect(() => {
    if (!isEdit || !id) return;
    async function load() {
      try {
        const res = await getProjectByIdApi(id);
        if (res.data) setForm({ ...initialForm, ...res.data });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "code") {
      codeEdited.current = value !== "";
    }
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "endDate" && next.startDate && value && value < next.startDate) {
        toast.error("End date cannot be before start date");
        return { ...prev, endDate: "" };
      }
      if (name === "startDate" && next.endDate && value && next.endDate < value) {
        toast.error("Start date is after end date — end date cleared");
        return { ...prev, startDate: value, endDate: "" };
      }
      return next;
    });
  };

  // auto-generate code from project name while user hasn't manually set one
  useEffect(() => {
    if (isEdit || codeEdited.current) return;
    setForm((prev) => ({ ...prev, code: generateCode(prev.name) }));
  }, [form.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e) => {
    e.preventDefault();

    const nameVal = form.name.trim();
    if (!nameVal) { toast.error("Project name is required"); return; }
    if (nameVal.length < 3) { toast.error("Project name must be at least 3 characters"); return; }

    if (!form.clientId) { toast.error("Please select a client"); return; }

    if (!form.startDate) { toast.error("Start date is required"); return; }

    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        tenantId,
        budget: Number(form.budget) || 0,
        spent:  Number(form.spent)  || 0,
      };
      if (isEdit) {
        const res = await updateProjectApi(id, payload);
        toast.success(`Project "${res.data.name}" updated`);
        navigate(tp("/projects"));
      } else {
        const res = await createProjectApi(payload);
        setCreatedProject(res.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── SUCCESS PAGE ── */
  if (createdProject) {
    return (
      <section className="flex h-[90dvh] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5">

          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={44} />
            <h2 className="text-lg font-semibold text-slate-900">Project Created!</h2>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium">{createdProject.name}</span> has been added successfully.
            </p>
            {createdProject.code && (
              <span className="mt-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-mono font-semibold text-indigo-700">
                {createdProject.code}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(tp(`/invoices/create?projectId=${createdProject.id}&projectName=${encodeURIComponent(createdProject.name)}`))}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FilePlus size={18} />
              Create Invoice for this Project
            </button>

            <button
              onClick={() => { setCreatedProject(null); setForm(initialForm); codeEdited.current = false; }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FolderPlus size={18} />
              Create Another Project
            </button>

            <Link
              to={tp("/projects")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm text-slate-500 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Projects
            </Link>
          </div>

        </div>
      </section>
    );
  }

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Edit Project" : "Create Project"}
          </h1>
          <p className="text-sm text-slate-500">Manage project details</p>
        </div>
        <Link to={tp("/projects")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      {/* prefill banner */}
      {!isEdit && prefillClientId && prefillClientName && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          Creating project for client: <span className="font-semibold">{prefillClientName}</span>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6 p-6">

          <div className="grid gap-4 sm:grid-cols-2">

            <Input
              label="Project Name *"
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Project Code
                {!isEdit && !codeEdited.current && form.name && (
                  <span className="ml-2 text-[10px] font-normal text-indigo-500">auto-generated</span>
                )}
              </label>
              <input
                name="code"
                value={form.code}
                onChange={onChange}
                placeholder="e.g. WEB-2026-001"
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* CLIENT DROPDOWN */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Client *</label>
              <select
                name="clientId"
                value={form.clientId}
                onChange={onChange}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` (${c.company})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Type"
              name="type"
              value={form.type}
              onChange={onChange}
              placeholder="e.g. Web Development"
            />

            <Input
              label="Budget (₹)"
              name="budget"
              type="number"
              min="0"
              value={form.budget}
              onChange={onChange}
            />

            <Input
              label="Spent (₹)"
              name="spent"
              type="number"
              min="0"
              value={form.spent}
              onChange={onChange}
            />

            <Input
              type="date"
              label="Start Date *"
              name="startDate"
              value={form.startDate}
              onChange={onChange}
            />

            <Input
              type="date"
              label="End Date"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              min={form.startDate || undefined}
            />

            <Input
              label="Project Manager (User ID)"
              name="projectManager"
              value={form.projectManager}
              onChange={onChange}
            />

            <Select label="Priority" name="priority" value={form.priority} onChange={onChange}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </Select>

            <Select label="Status" name="status" value={form.status} onChange={onChange}>
              <option value="PLANNING">PLANNING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_HOLD">ON HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>

          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea
              rows="4"
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
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
      <input {...props} className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select {...props} className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
        {children}
      </select>
    </div>
  );
}
