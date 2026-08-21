import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";
import { getTenantsApi } from "../../services/api/tenant.api";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= PAGINATION ================= */

  const TENANTS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(tenants.length / TENANTS_PER_PAGE);

  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * TENANTS_PER_PAGE;

    const end = start + TENANTS_PER_PAGE;

    return tenants.slice(start, end);
  }, [tenants, currentPage]);

  /* ================= FETCH TENANTS ================= */

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      setLoading(true);

      const res = await getTenantsApi();

      setTenants(res.data || []);
    } catch (error) {
      console.error("Failed to load tenants:", error);
    } finally {
      setLoading(false);
    }
  }

  /* ================= TOGGLE STATUS ================= */

  const toggleStatus = (id) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            }
          : t,
      ),
    );
  };

  return (
    <section className="h-[90dvh] overflow-y-auto space-y-6 pr-2 pb-10">
      {/* ================= HEADER ================= */}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>

        <p className="text-sm text-slate-500">Manage tenant status</p>
      </div>

      {/* ================= TABLE WRAPPER ================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* ================= SCROLLABLE AREA ================= */}

        <div className="max-h-[calc(95vh-220px)] overflow-y-auto p-4">
          <div className="space-y-3">
            {loading ? (
              <div className="py-10 text-center text-slate-500">
                Loading tenants...
              </div>
            ) : tenants.length > 0 ? (
              paginatedTenants.map((t) => {
                const isActive = t.status === "ACTIVE";

                return (
                  <div
                    key={t.id}
                    className="grid grid-cols-3 items-center rounded-lg bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                  >
                    {/* LEFT */}
                    <Link to={`/system/tenants/${t.id}`} className="text-left">
                      <h3 className="text-sm font-semibold text-slate-800 hover:text-indigo-600">
                        {t.name}
                      </h3>

                      <p className="text-xs text-slate-500">Plan: {t.plan}</p>
                    </Link>

                    {/* CENTER */}
                    <div className="flex justify-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* RIGHT */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => toggleStatus(t.id)}
                        className={`w-24 h-9 flex items-center justify-center rounded-lg text-xs font-medium text-white transition ${
                          isActive
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isActive ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-500">
                No tenants found
              </div>
            )}
          </div>
        </div>

        {/* ================= PAGINATION ================= */}

        {!loading && tenants.length > TENANTS_PER_PAGE && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row">
            {/* INFO */}
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * TENANTS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * TENANTS_PER_PAGE, tenants.length)}
              </span>{" "}
              of <span className="font-medium">{tenants.length}</span> companies
            </p>

            {/* BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({
                length: totalPages,
              }).map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
