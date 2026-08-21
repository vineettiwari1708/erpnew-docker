import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/* ── DESIGN TOKENS ── */
const C = {
  indigo:      "#4f46e5",
  indigoDark:  "#3730a3",
  indigoLight: "#e0e7ff",
  indigoMid:   "#818cf8",
  slate900:    "#0f172a",
  slate700:    "#334155",
  slate500:    "#64748b",
  slate300:    "#cbd5e1",
  slate100:    "#f1f5f9",
  slate50:     "#f8fafc",
  white:       "#ffffff",
  greenBg:     "#dcfce7",
  greenText:   "#15803d",
  amberBg:     "#fef9c3",
  amberText:   "#b45309",
  redBg:       "#fee2e2",
  redText:     "#dc2626",
};

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: C.slate700,
    backgroundColor: C.white,
  },

  /* ── HEADER BAND ── */
  headerBand: {
    backgroundColor: C.indigo,
    paddingHorizontal: 32,
    paddingTop: 22,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  headerSubId: {
    color: C.indigoMid,
    fontSize: 9,
    marginTop: 4,
  },
  headerSubDate: {
    color: C.indigoMid,
    fontSize: 9,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerCompanyName: {
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  headerCompanyInfo: {
    color: C.indigoMid,
    fontSize: 8,
    marginTop: 3,
  },

  /* ── BODY ── */
  body: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 60,
  },

  /* ── INFO CARDS ── */
  infoRow: {
    flexDirection: "row",
    marginBottom: 22,
  },
  infoBox: {
    flex: 1,
    marginRight: 12,
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate300,
    borderRadius: 6,
    padding: 12,
  },
  infoBoxAccent: {
    flex: 1,
    backgroundColor: C.indigoLight,
    borderLeftWidth: 3,
    borderLeftColor: C.indigo,
    borderTopWidth: 1,
    borderTopColor: C.indigoMid,
    borderRightWidth: 1,
    borderRightColor: C.indigoMid,
    borderBottomWidth: 1,
    borderBottomColor: C.indigoMid,
    borderRadius: 6,
    padding: 12,
  },
  infoSectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: C.slate500,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  infoLine: {
    fontSize: 9,
    color: C.slate700,
    marginBottom: 3,
  },
  infoLineBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.slate900,
    marginBottom: 4,
  },

  /* ── STATUS BADGE ── */
  badgePaid:    { backgroundColor: C.greenBg, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start", marginTop: 5 },
  badgePending: { backgroundColor: C.amberBg, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start", marginTop: 5 },
  badgeOverdue: { backgroundColor: C.redBg,   borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start", marginTop: 5 },
  badgeDraft:   { backgroundColor: C.slate100, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start", marginTop: 5 },
  badgeTextPaid:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.greenText },
  badgeTextPending: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.amberText },
  badgeTextOverdue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.redText },
  badgeTextDraft:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.slate500 },

  /* ── TABLE ── */
  tableWrap: {
    marginBottom: 20,
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
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.white,
  },
  tableRowOdd: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    backgroundColor: C.slate50,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: C.white,
    textTransform: "uppercase",
  },
  td: { fontSize: 9, color: C.slate700 },

  colNum:  { width: "6%" },
  colDesc: { flex: 1 },
  colQty:  { width: "10%", textAlign: "center" },
  colRate: { width: "20%", textAlign: "right" },
  colAmt:  { width: "20%", textAlign: "right" },

  /* ── SUMMARY ── */
  summaryOuter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  summaryBox: {
    width: "44%",
    borderWidth: 1,
    borderColor: C.slate300,
    borderRadius: 6,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  summaryLabel: { fontSize: 9, color: C.slate500 },
  summaryVal:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.slate700 },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.indigo,
  },
  balanceLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white },
  balanceVal:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white },

  /* ── SIGNATURE ── */
  sigRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  sigBox: {
    borderWidth: 1,
    borderColor: C.slate300,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    width: 160,
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.slate300,
    width: 110,
    height: 22,
    marginBottom: 6,
  },
  sigLabel: { fontSize: 8, color: C.slate500, textTransform: "uppercase" },
  sigName:  { fontSize: 8, color: C.slate700, marginTop: 2 },

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
  footerText: { fontSize: 8, color: C.slate500 },
  footerBrand: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.indigo },
});

/* ── HELPERS ── */
function fmt(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status }) {
  const map = {
    PAID:    { box: s.badgePaid,    txt: s.badgeTextPaid },
    PENDING: { box: s.badgePending, txt: s.badgeTextPending },
    OVERDUE: { box: s.badgeOverdue, txt: s.badgeTextOverdue },
  };
  const { box, txt } = map[status] || { box: s.badgeDraft, txt: s.badgeTextDraft };
  return (
    <View style={box}>
      <Text style={txt}>{status}</Text>
    </View>
  );
}

/* ── COMPONENT ── */
const InvoicePDF = ({ tenant, invoice }) => {
  if (!tenant || !invoice) return null;

  const amount   = Number(invoice.amount || 0);
  const gstRate  = tenant.gstRate || 18;
  const gst      = (amount * gstRate) / 100;
  const cgst     = gst / 2;
  const sgst     = gst / 2;
  const total    = amount + gst;
  const balDue   = invoice.status === "PAID" ? 0 : total;

  const today   = new Date().toLocaleDateString("en-IN");
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
    : "—";

  const items = [
    { desc: "Software Subscription Plan", qty: 1, price: amount },
    { desc: "Support & Maintenance",       qty: 1, price: 0 },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER BAND ── */}
        <View style={s.headerBand}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>INVOICE</Text>
            <Text style={s.headerSubId}>#{invoice.id}</Text>
            <Text style={s.headerSubDate}>Issued: {today}</Text>
          </View>
          <View style={s.headerRight}>
            {tenant.logo ? (
              <Image
                src={tenant.logo}
                style={{ width: 36, height: 36, borderRadius: 4, marginBottom: 6 }}
              />
            ) : null}
            <Text style={s.headerCompanyName}>{tenant.name}</Text>
            <Text style={s.headerCompanyInfo}>{tenant.email}</Text>
            <Text style={s.headerCompanyInfo}>{tenant.phone}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── INFO CARDS ── */}
          <View style={s.infoRow}>
            <View style={s.infoBox}>
              <Text style={s.infoSectionLabel}>Billed To</Text>
              <Text style={s.infoLineBold}>{tenant.name}</Text>
              <Text style={s.infoLine}>{tenant.address?.line1}</Text>
              <Text style={s.infoLine}>
                {tenant.address?.city}, {tenant.address?.state}
              </Text>
              <Text style={s.infoLine}>
                {tenant.address?.country} – {tenant.address?.pincode}
              </Text>
              {tenant.gstNumber ? (
                <Text style={s.infoLine}>GSTIN: {tenant.gstNumber}</Text>
              ) : null}
            </View>

            <View style={s.infoBoxAccent}>
              <Text style={s.infoSectionLabel}>Invoice Details</Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Invoice #  </Text>
                {invoice.id}
              </Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Issue Date  </Text>
                {today}
              </Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Due Date    </Text>
                {dueDate}
              </Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>GST Rate    </Text>
                {gstRate}%
              </Text>
              <StatusBadge status={invoice.status} />
            </View>
          </View>

          {/* ── TABLE ── */}
          <View style={s.tableWrap}>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.colNum]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colRate]}>Rate</Text>
              <Text style={[s.th, s.colAmt]}>Amount</Text>
            </View>

            {items.map((item, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd}>
                <Text style={[s.td, s.colNum]}>{i + 1}</Text>
                <Text style={[s.td, s.colDesc]}>{item.desc}</Text>
                <Text style={[s.td, s.colQty]}>{item.qty}</Text>
                <Text style={[s.td, s.colRate]}>{fmt(item.price)}</Text>
                <Text style={[s.td, s.colAmt]}>{fmt(item.qty * item.price)}</Text>
              </View>
            ))}
          </View>

          {/* ── SUMMARY ── */}
          <View style={s.summaryOuter}>
            <View style={s.summaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryVal}>{fmt(amount)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>CGST (9%)</Text>
                <Text style={s.summaryVal}>{fmt(cgst)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>SGST (9%)</Text>
                <Text style={s.summaryVal}>{fmt(sgst)}</Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLabel}>Total</Text>
                <Text style={s.summaryVal}>{fmt(total)}</Text>
              </View>
              <View style={s.balanceRow}>
                <Text style={s.balanceLabel}>Balance Due</Text>
                <Text style={s.balanceVal}>{fmt(balDue)}</Text>
              </View>
            </View>
          </View>

          {/* ── SIGNATURE ── */}
          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Authorized Signatory</Text>
              <Text style={s.sigName}>{tenant.name}</Text>
            </View>
          </View>

        </View>

        {/* ── FOOTER (fixed) ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Thank you for your business</Text>
          <Text style={s.footerBrand}>{tenant.name}</Text>
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

export default InvoicePDF;
