import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLedgerApi } from "../../services/api/ledger.api";
import { useAuth } from "../../store/hooks";

export default function Ledger() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    getLedgerApi(tenantId)
      .then((res) => setLedger(res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  // STATS
  const stats = useMemo(() => {
    const total = ledger.length;

    const credit = ledger
      .filter((l) => l.type === "CREDIT")
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    const debit = ledger
      .filter((l) => l.type === "DEBIT")
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    return {
      total,
      credit,
      debit,
      balance: credit - debit,
    };
  }, [ledger]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <section className="h-[calc(95vh-80px)] overflow-y-auto space-y-6 pr-2">

      {/* HEADER */}
      <div className="rounded-xl border bg-gradient-to-r from-indigo-50 to-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">
          Personal financial transactions
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Total Entries" value={stats.total} />
        <Card title="Credit" value={`₹${stats.credit}`} color="text-green-600" />
        <Card title="Debit" value={`₹${stats.debit}`} color="text-red-600" />
        <Card
          title="Balance"
          value={`₹${stats.balance}`}
          color={stats.balance >= 0 ? "text-green-600" : "text-red-600"}
        />
      </div>

      {/* LIST */}
      <div className="rounded-xl border bg-white overflow-hidden">

        <div className="p-4 border-b">
          <h2 className="font-semibold text-slate-800">
            Transaction History
          </h2>
        </div>

        <div className="divide-y">

          {ledger.map((item) => (
            <Link
              key={item.id}
              to={`/ledger/${item.id}`}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
            >

              {/* LEFT */}
              <div>
                <p className="font-medium text-slate-800 hover:text-indigo-600">
                  {formatSource(item.source)}
                </p>

                <p className="text-xs text-slate-500">
                  Ref: {item.referenceId}
                </p>

                <p className="text-xs text-slate-400">
                  {item.createdAt || "No date"}
                </p>
              </div>

              {/* TYPE */}
              <span
                className={`fp px-3 py-1 text-xs font-semibold rounded-full ${
                  item.type === "CREDIT"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.type}
              </span>

              {/* AMOUNT */}
              <p
                className={`font-semibold ${
                  item.type === "CREDIT"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.type === "CREDIT" ? "+" : "-"} ₹{item.amount}
              </p>

            </Link>
          ))}

        </div>
      </div>
    </section>
  );
}

/* CARD */
function Card({ title, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500 uppercase">{title}</p>
      <h2 className={`text-xl font-semibold mt-1 ${color}`}>
        {value}
      </h2>
    </div>
  );
}

/* FORMAT */
function formatSource(source) {
  return source
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}