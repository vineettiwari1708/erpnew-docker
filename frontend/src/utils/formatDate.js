/**
 * Format an ISO date string or Date object.
 * Returns "—" for null/undefined/invalid values.
 * Output: "31 Jul 2026, 10:30 AM"
 */
export function fmtDate(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Date only, no time: "31 Jul 2026"
 */
export function fmtDateOnly(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}
