import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { Search, X, ChevronDown, User, FolderKanban } from "lucide-react";
import toast from "react-hot-toast";

import {
  createInvoiceApi,
  getInvoiceByIdApi,
  updateInvoiceApi,
  getNextInvoiceNumberApi,
} from "../../services/api/invoice.api";
import { getClientsApi } from "../../services/api/client.api";
import { getProjectsApi } from "../../services/api/project.api";
import { useAuth, useTenantPath } from "../../store/hooks";

const initialForm = {
  clientId: "",
  projectId: "",
  invoiceNumber: "",
  title: "",
  amount: "",
  tax: "",
  discount: "",
  status: "PENDING",
  issueDate: "",
  dueDate: "",
  notes: "",
};

export default function CreateInvoices() {
  const tp = useTenantPath();
  const { user } = useAuth();
  const editMatch = useMatch("/tenant/:tenantId/invoices/edit/:id");
  const isEdit = Boolean(editMatch);
  const id = editMatch?.params?.id ?? null;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [invNumLoading, setInvNumLoading] = useState(false);

  const tenantId = user?.tenantId;

  const totalAmount = useMemo(() => {
    const amt = Number(form.amount) || 0;
    const tax = Number(form.tax) || 0;
    const disc = Number(form.discount) || 0;
    return amt + tax - disc;
  }, [form.amount, form.tax, form.discount]);

  /* ── LOAD CLIENTS + PROJECTS ── */
  useEffect(() => {
    if (!tenantId) return;
    async function fetchOptions() {
      try {
        const [clientRes, projectRes] = await Promise.all([
          getClientsApi(tenantId),
          getProjectsApi(tenantId),
        ]);
        const clients  = clientRes.data  || [];
        const projects = projectRes.data || [];

        // Group: [{ clientId, clientName, email, company, projects: [{id, name, code}] }]
        const grouped = clients.map((c) => ({
          clientId:   c.id,
          clientName: c.name,
          email:      c.email || "",
          company:    c.company || "",
          projects:   projects
            .filter((p) => p.clientId === c.id)
            .map((p) => ({ id: p.id, name: p.name, code: p.code || "" })),
        }));
        setOptions(grouped);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }
    fetchOptions();
  }, [tenantId]);

  /* ── LOAD FOR EDIT ── */
  useEffect(() => {
    async function load() {
      if (!isEdit) return;
      try {
        const res = await getInvoiceByIdApi(id);
        const inv = res.data;
        if (inv) {
          setForm({
            ...initialForm,
            ...inv,
            amount: inv.amount?.toString() || "",
            tax: inv.tax?.toString() || "",
            discount: inv.discount?.toString() || "",
            issueDate: inv.issueDate?.split("T")[0] || "",
            dueDate: inv.dueDate?.split("T")[0] || "",
          });
        }
      } catch (err) {
        console.error("Load invoice error:", err);
      }
    }
    load();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (opt) => {
    setSelectedOption(opt);
    setForm((prev) => ({ ...prev, clientId: opt.clientId, projectId: opt.projectId }));
  };

  const handleClear = () => {
    setSelectedOption(null);
    setForm((prev) => ({ ...prev, clientId: "", projectId: "", invoiceNumber: "" }));
  };

  /* ── AUTO-GENERATE INVOICE NUMBER on client+project selection ── */
  useEffect(() => {
    if (isEdit) return; // don't overwrite existing invoice number in edit mode
    if (!selectedOption?.clientId) return;

    let cancelled = false;
    async function generate() {
      setInvNumLoading(true);
      try {
        const res = await getNextInvoiceNumberApi(
          tenantId,
          selectedOption.clientId,
          selectedOption.projectId || ""
        );
        if (!cancelled) {
          setForm((prev) => ({ ...prev, invoiceNumber: res.data.invoiceNumber }));
        }
      } catch (err) {
        console.error("Invoice number generation failed:", err);
      } finally {
        if (!cancelled) setInvNumLoading(false);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [selectedOption, tenantId, isEdit]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tenantId,
        amount: Number(form.amount),
        tax: Number(form.tax) || 0,
        discount: Number(form.discount) || 0,
        totalAmount,
      };
      if (isEdit) {
        const res = await updateInvoiceApi(id, payload);
        toast.success(`Invoice "${res.data.invoiceNumber || res.data.id}" updated`);
      } else {
        const res = await createInvoiceApi(payload);
        toast.success(`Invoice "${res.data.invoiceNumber || res.data.id}" created`);
        setForm(initialForm);
        setSelectedOption(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Edit Invoice" : "Create Invoice"}
          </h1>
          <p className="text-sm text-slate-500">Manage invoice details</p>
        </div>
        <Link to={tp("/invoices")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      {/* FORM */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6 p-6">

          {/* CLIENT + PROJECT PICKER */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Client &amp; Project</label>
            <CustomerPicker
              options={options}
              selected={selectedOption}
              onSelect={handleSelect}
              onClear={handleClear}
            />
          </div>

          {/* INVOICE NUMBER + TITLE */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Invoice Number
                {invNumLoading && (
                  <span className="ml-2 text-[10px] font-normal text-indigo-400 animate-pulse">
                    generating…
                  </span>
                )}
              </label>
              <input
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={onChange}
                placeholder={invNumLoading ? "Generating…" : "Select client & project above"}
                disabled={invNumLoading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <Input
              label="Title"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Website Redesign - Phase 1"
            />
          </div>

          {/* AMOUNT + TAX + DISCOUNT */}
          <div className="rounded-xl border bg-slate-50 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Amount Breakdown</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Amount (₹)"
                name="amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={onChange}
                placeholder="0.00"
              />
              <Input
                label="Tax (₹)"
                name="tax"
                type="number"
                min="0"
                value={form.tax}
                onChange={onChange}
                placeholder="0.00"
              />
              <Input
                label="Discount (₹)"
                name="discount"
                type="number"
                min="0"
                value={form.discount}
                onChange={onChange}
                placeholder="0.00"
              />
            </div>
            {/* TOTAL DISPLAY */}
            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">Total Amount</span>
              <span className="text-lg font-bold text-indigo-700">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* STATUS + DATES */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Status" name="status" value={form.status} onChange={onChange}>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
            </Select>
            <Input
              type="date"
              label="Issue Date"
              name="issueDate"
              value={form.issueDate}
              onChange={onChange}
            />
            <Input
              type="date"
              label="Due Date"
              name="dueDate"
              value={form.dueDate}
              onChange={onChange}
            />
          </div>

          {/* NOTES */}
          <div>
            <label className="text-xs font-medium text-slate-600">Notes</label>
            <textarea
              rows="3"
              name="notes"
              value={form.notes}
              onChange={onChange}
              placeholder="Any additional notes..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isEdit ? "Update Invoice" : "Create Invoice"}
          </button>


        </form>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CLIENT + PROJECT PICKER
   options: [{ clientId, clientName, email, company, projects:[{id,name,code}] }]
═══════════════════════════════════════════ */
function CustomerPicker({ options, selected, onSelect, onClear }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter clients + their projects by search query
  const filtered = options
    .map((c) => {
      const q = query.toLowerCase();
      const clientMatch =
        c.clientName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q);

      const matchedProjects = c.projects.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );

      if (!query) return c; // no filter — show all
      if (clientMatch) return c; // entire client matches
      if (matchedProjects.length) return { ...c, projects: matchedProjects }; // subset of projects
      return null;
    })
    .filter(Boolean);

  const pick = (clientGroup, project) => {
    onSelect({
      clientId:    clientGroup.clientId,
      clientName:  clientGroup.clientName,
      email:       clientGroup.email,
      projectId:   project?.id   || "",
      projectName: project?.name || "",
      projectCode: project?.code || "",
    });
    setOpen(false);
    setQuery("");
  };

  /* ── SELECTED STATE ── */
  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {selected.clientName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{selected.clientName}</p>
            <p className="text-xs text-slate-500">{selected.email}</p>
            {selected.projectName && (
              <div className="mt-1 flex items-center gap-1.5">
                <FolderKanban size={12} className="text-indigo-400" />
                <span className="text-xs font-medium text-indigo-600">{selected.projectName}</span>
                {selected.projectCode && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {selected.projectCode}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  /* ── DROPDOWN ── */
  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(true)}
        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
          open ? "border-indigo-400 ring-1 ring-indigo-300" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <Search size={15} className="shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search client or project..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
        />
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <User size={28} className="text-slate-300" />
              <p className="text-sm">No clients found</p>
            </div>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.clientId} className="border-b border-slate-100 last:border-0">

                  {/* ── CLIENT HEADER ── */}
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {c.clientName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.clientName}</p>
                      {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                      {c.projects.length} project{c.projects.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* ── PROJECT ROWS ── */}
                  {c.projects.length === 0 ? (
                    <div className="px-6 py-2 text-xs text-slate-400 italic">No projects</div>
                  ) : (
                    <ul>
                      {c.projects.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pick(c, p)}
                            className="flex w-full items-center gap-3 pl-8 pr-4 py-2.5 text-left hover:bg-indigo-50 transition-colors"
                          >
                            <FolderKanban size={14} className="shrink-0 text-indigo-400" />
                            <span className="flex-1 truncate text-sm text-slate-700">{p.name}</span>
                            {p.code && (
                              <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                                {p.code}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   INPUT / SELECT HELPERS
═══════════════════════════════════════════ */
function Input({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}
