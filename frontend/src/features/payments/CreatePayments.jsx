import { useEffect, useRef, useState } from "react";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, ChevronDown, User, FolderKanban, Upload, FileImage, FileText as FilePdf, CheckCircle, IndianRupee, Receipt } from "lucide-react";
import toast from "react-hot-toast";

import {
  createPaymentApi,
  getPaymentByIdApi,
  updatePaymentApi,
} from "../../services/api/payment.api";
import { getClientsApi } from "../../services/api/client.api";
import { getProjectsApi } from "../../services/api/project.api";
import { getInvoicesApi, getInvoiceByIdApi } from "../../services/api/invoice.api";
import { useAuth, useTenantPath } from "../../store/hooks";

const initialForm = {
  clientId: "",
  projectId: "",
  invoiceId: "",
  amount: "",
  method: "CASH",
  status: "SUCCESS",
  transactionId: "",
  paidAt: "",
  notes: "",
};

export default function CreatePayment() {
  const tp = useTenantPath();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preInvoiceId = searchParams.get("invoiceId");
  const editMatch = useMatch("/tenant/:tenantId/payments/edit/:id");
  const isEdit = Boolean(editMatch);
  const id = editMatch?.params?.id ?? null;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [createdPayment, setCreatedPayment] = useState(null);

  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const proofInputRef = useRef(null);

  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const tenantId = user?.tenantId;
  const isClientRole = user?.role === "CLIENT";

  /* ── LOAD CLIENTS + PROJECTS FOR PICKER ── */
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

        // Group: active clients only; exclude completed/cancelled projects
        const grouped = clients
          .filter((c) => c.status === "ACTIVE")
          .map((c) => ({
            clientId:   c.id,
            clientName: c.name,
            email:      c.email || "",
            company:    c.company || "",
            projects:   projects
              .filter((p) => p.clientId === c.id && p.status !== "COMPLETED" && p.status !== "CANCELLED")
              .map((p) => ({ id: p.id, name: p.name, code: p.code || "" })),
          }));

        setOptions(grouped);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }
    fetchOptions();
  }, [tenantId]);

  /* ── PRE-FILL FROM ?invoiceId= URL PARAM ── */
  useEffect(() => {
    if (!preInvoiceId || isEdit || options.length === 0) return;
    async function prefill() {
      try {
        const res = await getInvoiceByIdApi(preInvoiceId);
        const inv = res.data;
        if (!inv) return;

        // Find matching client in options
        const clientOpt = options.find((o) => o.clientId === inv.clientId);
        if (clientOpt) {
          setSelectedOption({
            clientId:    clientOpt.clientId,
            clientName:  clientOpt.clientName,
            email:       clientOpt.email,
            projectId:   inv.projectId || "",
            projectName: clientOpt.projects.find((p) => p.id === inv.projectId)?.name || "",
            projectCode: clientOpt.projects.find((p) => p.id === inv.projectId)?.code || "",
          });
          // Load all invoices for this client, then set selected invoice
          const allRes = await getInvoicesApi(tenantId);
          const clientInvs = (allRes.data || []).filter(
            (i) => i.clientId === inv.clientId && !["PAID", "CANCELLED"].includes(i.status)
          );
          setInvoices(clientInvs);
          const balance = Math.max(0, (inv.totalAmount || inv.amount || 0) - (inv.paidAmount || 0));
          setForm((prev) => ({ ...prev, clientId: inv.clientId, invoiceId: inv.id, amount: String(balance) }));
        }
      } catch {
        // ignore
      }
    }
    prefill();
  }, [preInvoiceId, isEdit, options, tenantId]);

  /* ── CLIENT ROLE: auto-select their own single client (no picker needed) ── */
  useEffect(() => {
    if (!isClientRole || preInvoiceId || isEdit || selectedOption || options.length === 0) return;
    const own = options[0];
    if (own) handleSelect(own);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientRole, preInvoiceId, isEdit, options]);

  /* ── LOAD FOR EDIT ── */
  useEffect(() => {
    async function load() {
      if (!isEdit) return;
      try {
        const res = await getPaymentByIdApi(id);
        const payment = res.data;
        if (payment) {
          setForm({
            ...initialForm,
            ...payment,
            amount: payment.amount?.toString() || "",
            paidAt: payment.paidAt?.split("T")[0] || "",
            transactionId: payment.transactionId || "",
          });
          if (payment.proofUrl) setProofPreview(payment.proofUrl);
        }
      } catch (err) {
        console.error("Load payment error:", err);
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
    setForm((prev) => ({ ...prev, clientId: opt.clientId, projectId: opt.projectId, invoiceId: "", amount: "" }));
    // Load invoices for this client+project
    if (tenantId) {
      getInvoicesApi(tenantId).then((res) => {
        const all = res.data || [];
        setInvoices(
          all.filter(
            (inv) =>
              inv.clientId === opt.clientId &&
              (!opt.projectId || !inv.projectId || inv.projectId === opt.projectId) &&
              !["PAID", "CANCELLED"].includes(inv.status)
          )
        );
      }).catch(() => setInvoices([]));
    }
  };

  const handleClear = () => {
    setSelectedOption(null);
    setInvoices([]);
    setForm((prev) => ({ ...prev, clientId: "", projectId: "", invoiceId: "", amount: "" }));
  };

  const handleInvoiceSelect = (e) => {
    const invId = e.target.value;
    const inv = invoices.find((i) => i.id === invId);
    const balance = inv
      ? Math.max(0, (inv.totalAmount || inv.amount || 0) - (inv.paidAmount || 0))
      : 0;
    setForm((prev) => ({
      ...prev,
      invoiceId: invId,
      amount: inv ? String(balance) : prev.amount,
    }));
  };

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    // Create local preview URL
    const url = URL.createObjectURL(file);
    setProofPreview(url);
  };

  const handleProofRemove = () => {
    setProofFile(null);
    setProofPreview(null);
    setForm((prev) => ({ ...prev, proofUrl: "" }));
    if (proofInputRef.current) proofInputRef.current.value = "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.invoiceId && !isEdit) {
      toast.error("Please select an invoice");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("invoiceId",     form.invoiceId);
      fd.append("clientId",      form.clientId);
      fd.append("amount",        String(Number(form.amount)));
      fd.append("method",        form.method);
      fd.append("status",        form.status);
      if (form.transactionId) fd.append("transactionId", form.transactionId);
      if (form.paidAt)        fd.append("paidAt",        form.paidAt);
      if (form.notes)         fd.append("notes",         form.notes);
      if (proofFile)          fd.append("proof",         proofFile);
      const payload = fd;
      if (isEdit) {
        const res = await updatePaymentApi(id, payload);
        toast.success(`Payment "${res.data.paymentNumber || res.data.id.slice(0,8)}" updated`);
      } else {
        const res = await createPaymentApi(payload);
        toast.success(`Payment "${res.data.paymentNumber || res.data.id.slice(0,8)}" recorded`);
        setCreatedPayment({ ...res.data, clientName: selectedOption?.clientName });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ── SUCCESS PAGE ── */
  if (createdPayment) {
    const resetAll = () => {
      setCreatedPayment(null);
      setForm(initialForm);
      setSelectedOption(null);
      setInvoices([]);
      setProofFile(null);
      setProofPreview(null);
    };
    return (
      <section className="flex h-[90dvh] items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">

          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={44} />
            <h2 className="text-lg font-semibold text-slate-900">
              {isClientRole ? "Payment Submitted!" : "Payment Recorded!"}
            </h2>
            {isClientRole && (
              <p className="mt-1 text-sm text-slate-500">Awaiting approval from the team</p>
            )}
            {createdPayment.paymentNumber && (
              <span className="mt-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-mono font-semibold text-indigo-700">
                {createdPayment.paymentNumber}
              </span>
            )}
            <div className="mt-3 space-y-1">
              <p className="text-sm text-slate-600">
                Amount:{" "}
                <span className="font-semibold text-slate-800">
                  ₹{Number(createdPayment.amount || 0).toLocaleString("en-IN")}
                </span>
              </p>
              <p className="text-sm text-slate-500">
                Method: <span className="font-medium text-slate-700">{createdPayment.method?.replace("_", " ")}</span>
              </p>
              {createdPayment.clientName && (
                <p className="text-sm text-slate-500">
                  Client: <span className="font-medium text-slate-700">{createdPayment.clientName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetAll}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <IndianRupee size={18} />
              Record Another Payment
            </button>
            {!isClientRole && (
              <button
                onClick={() => navigate(tp(`/invoices/create`))}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Receipt size={18} />
                Create New Invoice
              </button>
            )}
            <Link
              to={tp(isClientRole ? "/payments/client" : "/payments")}
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-sm text-slate-500 hover:bg-slate-50"
            >
              ← Back to Payments
            </Link>
          </div>

        </div>
      </section>
    );
  }

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEdit ? "Edit Payment" : isClientRole ? "Submit Payment" : "Record Payment"}
          </h1>
          <p className="text-sm text-slate-500">
            {isClientRole ? "Submit a payment for review" : "Manage payment details"}
          </p>
        </div>
        <Link to={tp(isClientRole ? "/payments/client" : "/payments")} className="text-sm text-indigo-600 hover:underline">← Back</Link>
      </div>

      {/* FORM */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit} className="space-y-6 p-6">

          {/* CLIENT + PROJECT PICKER — hidden for CLIENT role, they only have themselves */}
          {!isClientRole && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Client &amp; Project</label>
              <CustomerPicker
                options={options}
                selected={selectedOption}
                onSelect={handleSelect}
                onClear={handleClear}
              />
            </div>
          )}

          {/* INVOICE SELECTOR — shown after client is picked */}
          {selectedOption && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Invoice <span className="text-red-500">*</span>
              </label>
              {invoices.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                  No unpaid invoices for this client
                </p>
              ) : (
                <select
                  value={form.invoiceId}
                  onChange={handleInvoiceSelect}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">— Select invoice —</option>
                  {invoices.map((inv) => {
                    const total   = Number(inv.totalAmount || inv.amount || 0);
                    const paid    = Number(inv.paidAmount  || 0);
                    const balance = Math.max(0, total - paid);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber || inv.id} · ₹{total.toLocaleString("en-IN")}
                        {paid > 0 ? ` · Bal ₹${balance.toLocaleString("en-IN")}` : ""} · {inv.status}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* AMOUNT + METHOD + STATUS */}
          <div className="grid gap-4 sm:grid-cols-2">

            <Input
              label="Amount (₹)"
              name="amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={onChange}
              placeholder="0.00"
            />

            <Select label="Method" name="method" value={form.method} onChange={onChange}>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="CARD">CARD</option>
              <option value="CHEQUE">CHEQUE</option>
            </Select>

            {isClientRole ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Submitted for review
                </div>
              </div>
            ) : (
              <Select label="Status" name="status" value={form.status} onChange={onChange}>
                <option value="SUCCESS">SUCCESS</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </Select>
            )}

            <Input
              type="date"
              label="Paid Date"
              name="paidAt"
              value={form.paidAt}
              onChange={onChange}
            />

          </div>

          {/* TRANSACTION ID */}
          <Input
            label="Transaction ID (Optional)"
            name="transactionId"
            value={form.transactionId}
            onChange={onChange}
            placeholder="e.g. UTR123456789"
          />

          {/* PAYMENT PROOF UPLOAD */}
          <div>
            <label className="text-xs font-medium text-slate-600">
              Payment Proof <span className="text-slate-400 font-normal">(JPG, PNG, PDF — max 5 MB)</span>
            </label>

            {proofPreview ? (
              <div className="mt-1 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                {/* Preview */}
                <div className="shrink-0">
                  {proofFile?.type === "application/pdf" || proofPreview.endsWith(".pdf") ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-100">
                      <FilePdf size={24} className="text-red-500" />
                    </div>
                  ) : (
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="h-14 w-14 rounded-lg border object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {proofFile?.name || "Existing proof"}
                  </p>
                  {proofFile && (
                    <p className="text-xs text-slate-500">
                      {(proofFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleProofRemove}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => proofInputRef.current?.click()}
                className="mt-1 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-6 text-slate-400 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-500"
              >
                <Upload size={22} />
                <span className="text-sm">Click to upload proof of payment</span>
                <span className="text-xs">Supports JPG, PNG, PDF</span>
              </button>
            )}

            <input
              ref={proofInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={handleProofChange}
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
              placeholder="Payment confirmation details..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isEdit ? "Update Payment" : isClientRole ? "Submit Payment" : "Record Payment"}
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

      if (!query) return c;
      if (clientMatch) return c;
      if (matchedProjects.length) return { ...c, projects: matchedProjects };
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

                  {/* ── CLIENT HEADER — clickable to select client without project ── */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(c, null)}
                    className="flex w-full items-center gap-3 bg-slate-50 px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors"
                  >
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
                  </button>

                  {/* ── PROJECT ROWS ── */}
                  {c.projects.length > 0 && (
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
