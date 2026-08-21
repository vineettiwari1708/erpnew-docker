import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import "./pdfFonts";

/* ── DESIGN TOKENS ── */
const C = {
  indigo:      "#4f46e5",
  indigoDark:  "#3730a3",
  indigoLight: "#e0e7ff",
  indigoMid:   "#818cf8",
  slate900:    "#0f172a",
  slate800:    "#1e293b",
  slate700:    "#334155",
  slate500:    "#64748b",
  slate300:    "#cbd5e1",
  slate100:    "#f1f5f9",
  slate50:     "#f8fafc",
  white:       "#ffffff",
  green:       "#16a34a",
  greenBg:     "#dcfce7",
  greenLight:  "#f0fdf4",
  amber:       "#d97706",
  amberBg:     "#fef9c3",
  red:         "#dc2626",
  redBg:       "#fee2e2",
};

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    fontFamily: "Roboto",
    color: C.slate700,
    backgroundColor: C.white,
  },

  /* ── HEADER BAND ── */
  headerBand: {
    backgroundColor: C.indigo,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 20,
    fontFamily: "Roboto", fontWeight: "bold",
    color: C.white,
  },
  headerSubtitle: {
    color: C.indigoMid,
    fontSize: 9,
    marginTop: 3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerDate: {
    color: C.indigoMid,
    fontSize: 8,
  },
  headerDateVal: {
    color: C.white,
    fontFamily: "Roboto", fontWeight: "bold",
    fontSize: 9,
    marginTop: 2,
  },

  /* ── BODY ── */
  body: {
    paddingHorizontal: 32,
    paddingTop: 22,
    paddingBottom: 60,
  },

  /* ── COMPANY CARD ── */
  companyCard: {
    flexDirection: "row",
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate300,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.indigoLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 20,
    fontFamily: "Roboto", fontWeight: "bold",
    color: C.indigo,
  },
  companyMain: {
    flex: 1,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Roboto", fontWeight: "bold",
    color: C.slate900,
    marginBottom: 3,
  },
  companyLine: {
    fontSize: 9,
    color: C.slate500,
    marginBottom: 2,
  },
  companyRight: {
    alignItems: "flex-end",
    width: 120,
  },
  companyMeta: {
    fontSize: 9,
    color: C.slate500,
    marginBottom: 4,
  },
  planBadge: {
    backgroundColor: C.indigoLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
    alignSelf: "flex-end",
  },
  planBadgeText: {
    fontSize: 8,
    fontFamily: "Roboto", fontWeight: "bold",
    color: C.indigo,
  },
  statusBadgeActive: {
    backgroundColor: C.greenBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },
  statusBadgeInactive: {
    backgroundColor: C.redBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },
  statusBadgeActiveText:   { fontSize: 8, fontFamily: "Roboto", fontWeight: "bold", color: C.green },
  statusBadgeInactiveText: { fontSize: 8, fontFamily: "Roboto", fontWeight: "bold", color: C.red },

  /* ── STAT CARDS ── */
  statsRow: {
    flexDirection: "row",
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    marginRight: 10,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  statCardLast: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Roboto", fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    textTransform: "uppercase",
  },

  /* ── SECTION TITLE ── */
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Roboto", fontWeight: "bold",
    color: C.slate800,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.slate300,
  },

  /* ── TABLE ── */
  tableWrap: {
    marginBottom: 22,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.indigo,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableRowEven: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.white,
  },
  tableRowOdd: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.slate50,
  },
  th: {
    fontFamily: "Roboto", fontWeight: "bold",
    fontSize: 8,
    color: C.white,
    textTransform: "uppercase",
  },
  td:     { fontSize: 9, color: C.slate700 },
  tdMono: { fontSize: 8, color: C.slate500 },

  colId:     { width: "22%" },
  colClient: { width: "22%" },
  colAmt:    { width: "18%", textAlign: "right" },
  colDue:    { width: "18%", textAlign: "center" },
  colStatus: { flex: 1, textAlign: "center" },

  /* ── STATUS PILL IN TABLE ── */
  pillPaid:    { backgroundColor: C.greenBg, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "center" },
  pillPending: { backgroundColor: C.amberBg, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "center" },
  pillOther:   { backgroundColor: C.slate100, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "center" },
  pillTextPaid:    { fontSize: 7, fontFamily: "Roboto", fontWeight: "bold", color: C.green },
  pillTextPending: { fontSize: 7, fontFamily: "Roboto", fontWeight: "bold", color: C.amber },
  pillTextOther:   { fontSize: 7, fontFamily: "Roboto", fontWeight: "bold", color: C.slate500 },

  /* ── SUMMARY FOOTER ROW ── */
  summaryStrip: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },
  summaryCell: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  summaryCellLabel: {
    fontSize: 8,
    color: C.slate500,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  summaryCellValue: {
    fontSize: 12,
    fontFamily: "Roboto", fontWeight: "bold",
  },

  /* ── FOOTER ── */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: C.slate100,
    backgroundColor: C.slate50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  footerText:  { fontSize: 8, color: C.slate500 },
  footerBrand: { fontSize: 8, fontFamily: "Roboto", fontWeight: "bold", color: C.indigo },
});

/* ── HELPERS ── */
function fmt(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

function StatusPill({ status }) {
  if (status === "PAID") {
    return (
      <View style={s.pillPaid}>
        <Text style={s.pillTextPaid}>PAID</Text>
      </View>
    );
  }
  if (status === "PENDING") {
    return (
      <View style={s.pillPending}>
        <Text style={s.pillTextPending}>PENDING</Text>
      </View>
    );
  }
  return (
    <View style={s.pillOther}>
      <Text style={s.pillTextOther}>{status || "—"}</Text>
    </View>
  );
}

/* ── COMPONENT ── */
const CompanyReportPDF = ({ tenant, invoices = [] }) => {
  if (!tenant) return null;

  const today        = new Date().toLocaleDateString("en-IN");
  const totalPaid    = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalPending = invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalAmt     = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const isActive     = tenant.status === "ACTIVE";

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER BAND ── */}
        <View style={s.headerBand}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>COMPANY INVOICE REPORT</Text>
            <Text style={s.headerSubtitle}>System Admin — Financial Summary</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>Generated on</Text>
            <Text style={s.headerDateVal}>{today}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── COMPANY CARD ── */}
          <View style={s.companyCard}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarLetter}>
                {(tenant.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={s.companyMain}>
              <Text style={s.companyName}>{tenant.name}</Text>
              <Text style={s.companyLine}>{tenant.email}</Text>
              <Text style={s.companyLine}>{tenant.phone}</Text>
              <Text style={s.companyLine}>{tenant.website || "—"}</Text>
              <Text style={s.companyLine}>
                {tenant.address?.line1}, {tenant.address?.city}, {tenant.address?.state} – {tenant.address?.pincode}
              </Text>
              {tenant.gstNumber ? (
                <Text style={s.companyLine}>GSTIN: {tenant.gstNumber}</Text>
              ) : null}
            </View>

            <View style={s.companyRight}>
              <View style={s.planBadge}>
                <Text style={s.planBadgeText}>{tenant.plan || "FREE"}</Text>
              </View>
              <View style={isActive ? s.statusBadgeActive : s.statusBadgeInactive}>
                <Text style={isActive ? s.statusBadgeActiveText : s.statusBadgeInactiveText}>
                  {tenant.status}
                </Text>
              </View>
              <Text style={[s.companyMeta, { marginTop: 8 }]}>
                GST Rate: {tenant.gstRate || 0}%
              </Text>
              <Text style={s.companyMeta}>
                Joined: {fmtDate(tenant.joinedAt)}
              </Text>
              <Text style={s.companyMeta}>
                Employees: {tenant.employees || "—"}
              </Text>
            </View>
          </View>

          {/* ── STAT CARDS ── */}
          <Text style={s.sectionTitle}>Financial Summary</Text>
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate300 }]}>
              <Text style={[s.statValue, { color: C.slate800 }]}>{invoices.length}</Text>
              <Text style={[s.statLabel, { color: C.slate500 }]}>Total Invoices</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: C.greenLight, borderWidth: 1, borderColor: "#bbf7d0" }]}>
              <Text style={[s.statValue, { color: C.green }]}>{fmt(totalPaid)}</Text>
              <Text style={[s.statLabel, { color: C.green }]}>Total Paid</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: C.amberBg, borderWidth: 1, borderColor: "#fde68a" }]}>
              <Text style={[s.statValue, { color: C.amber }]}>{fmt(totalPending)}</Text>
              <Text style={[s.statLabel, { color: C.amber }]}>Pending</Text>
            </View>
            <View style={[s.statCardLast, { backgroundColor: C.indigoLight, borderWidth: 1, borderColor: C.indigoMid }]}>
              <Text style={[s.statValue, { color: C.indigo }]}>{fmt(totalAmt)}</Text>
              <Text style={[s.statLabel, { color: C.indigo }]}>Grand Total</Text>
            </View>
          </View>

          {/* ── INVOICE TABLE ── */}
          <Text style={s.sectionTitle}>Invoice List</Text>
          <View style={s.tableWrap}>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.colId]}>Invoice ID</Text>
              <Text style={[s.th, s.colClient]}>Client ID</Text>
              <Text style={[s.th, s.colAmt]}>Amount</Text>
              <Text style={[s.th, s.colDue]}>Due Date</Text>
              <Text style={[s.th, s.colStatus]}>Status</Text>
            </View>

            {invoices.length === 0 ? (
              <View style={s.tableRowEven}>
                <Text style={[s.td, { flex: 1, textAlign: "center", color: C.slate500 }]}>
                  No invoices found
                </Text>
              </View>
            ) : (
              invoices.map((inv, i) => (
                <View key={inv.id || i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd}>
                  <Text style={[s.tdMono, s.colId]}>{inv.id || "—"}</Text>
                  <Text style={[s.tdMono, s.colClient]}>{inv.clientId || "—"}</Text>
                  <Text style={[s.td, s.colAmt]}>{fmt(inv.amount)}</Text>
                  <Text style={[s.td, s.colDue]}>{fmtDate(inv.dueDate)}</Text>
                  <View style={[s.colStatus, { flexDirection: "row", justifyContent: "center" }]}>
                    <StatusPill status={inv.status} />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ── SUMMARY STRIP ── */}
          <View style={s.summaryStrip}>
            <View style={[s.summaryCell, { backgroundColor: C.greenLight }]}>
              <Text style={[s.summaryCellLabel, { color: C.green }]}>Paid</Text>
              <Text style={[s.summaryCellValue, { color: C.green }]}>{fmt(totalPaid)}</Text>
            </View>
            <View style={[s.summaryCell, { backgroundColor: C.amberBg }]}>
              <Text style={[s.summaryCellLabel, { color: C.amber }]}>Pending</Text>
              <Text style={[s.summaryCellValue, { color: C.amber }]}>{fmt(totalPending)}</Text>
            </View>
            <View style={[s.summaryCell, { backgroundColor: C.indigo }]}>
              <Text style={[s.summaryCellLabel, { color: "#c7d2fe" }]}>Grand Total</Text>
              <Text style={[s.summaryCellValue, { color: C.white }]}>{fmt(totalAmt)}</Text>
            </View>
          </View>

        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Company Invoice Report — {tenant.name}
          </Text>
          <Text style={s.footerBrand}>Urbanfeat ERP</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
};

export default CompanyReportPDF;
