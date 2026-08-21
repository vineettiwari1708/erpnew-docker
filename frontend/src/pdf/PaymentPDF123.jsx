import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
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
  green:       "#16a34a",
  greenBg:     "#dcfce7",
  greenLight:  "#f0fdf4",
  amberBg:     "#fef9c3",
  amberText:   "#b45309",
  redBg:       "#fee2e2",
  redText:     "#dc2626",
};

const METHOD_COLORS = {
  UPI:          { bg: "#ede9fe", text: "#7c3aed" },
  "Bank Transfer": { bg: "#dbeafe", text: "#1d4ed8" },
  Cash:         { bg: C.greenBg, text: C.green },
  Cheque:       { bg: C.slate100, text: C.slate700 },
  Card:         { bg: "#fce7f3", text: "#9d174d" },
};

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: C.slate700,
    backgroundColor: C.white,
  },

  /* ── HEADER ── */
  headerBand: {
    backgroundColor: C.indigo,
    paddingHorizontal: 32,
    paddingTop: 22,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  headerSubtext: {
    color: C.indigoMid,
    fontSize: 9,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerBrandName: {
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  headerBrandInfo: {
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

  /* ── STATUS STRIP ── */
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate300,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  statusLeft: {},
  statusLabel: {
    fontSize: 8,
    color: C.slate500,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  statusValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
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
  infoBoxLast: {
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
    marginBottom: 4,
  },
  infoLineBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.slate900,
    marginBottom: 4,
  },

  /* ── METHOD BADGE ── */
  methodBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  methodBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
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
  tableRow: {
    flexDirection: "row",
    backgroundColor: C.slate50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: C.white,
    textTransform: "uppercase",
  },
  td: { fontSize: 9, color: C.slate700 },
  colDesc: { flex: 1 },
  colQty:  { width: "12%", textAlign: "center" },
  colAmt:  { width: "25%", textAlign: "right" },
  colTot:  { width: "25%", textAlign: "right" },

  /* ── AMOUNT HIGHLIGHT ── */
  amountCard: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  amountBox: {
    width: "44%",
    borderWidth: 1,
    borderColor: C.slate300,
    borderRadius: 6,
    overflow: "hidden",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
  },
  amountLabel: { fontSize: 9, color: C.slate500 },
  amountVal:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.slate700 },
  totalPaidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.green,
  },
  totalPaidLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white },
  totalPaidVal:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white },

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
  footerBrand: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.indigo },
});

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

function MethodBadge({ method }) {
  const { bg, text } = METHOD_COLORS[method] || { bg: C.slate100, text: C.slate700 };
  return (
    <View style={[s.methodBadge, { backgroundColor: bg }]}>
      <Text style={[s.methodBadgeText, { color: text }]}>{method || "—"}</Text>
    </View>
  );
}

/* ── COMPONENT ── */
const PaymentPDF = ({ payment }) => {
  if (!payment) return null;

  const amount  = Number(payment.amount || 0);
  const isPaid  = payment.status === "PAID" || payment.status === "COMPLETED";
  const today   = new Date().toLocaleDateString("en-IN");

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.headerBand}>
          <View>
            <Text style={s.headerTitle}>PAYMENT RECEIPT</Text>
            <Text style={s.headerSubtext}>#{payment.id}</Text>
            <Text style={s.headerSubtext}>
              Date: {fmtDate(payment.paymentDate)}
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerBrandName}>Urbanfeat ERP</Text>
            <Text style={s.headerBrandInfo}>support@urbanfeat.com</Text>
            <Text style={s.headerBrandInfo}>+91-9876543210</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── STATUS STRIP ── */}
          <View style={s.statusStrip}>
            <View style={s.statusLeft}>
              <Text style={s.statusLabel}>Payment Status</Text>
              <Text style={[s.statusValue, { color: isPaid ? C.green : C.amberText }]}>
                {payment.status}
              </Text>
            </View>
            <View>
              <Text style={s.statusLabel}>Payment Date</Text>
              <Text style={s.statusValue}>{fmtDate(payment.paymentDate)}</Text>
            </View>
            <View>
              <Text style={s.statusLabel}>Receipt Generated</Text>
              <Text style={s.statusValue}>{today}</Text>
            </View>
          </View>

          {/* ── INFO CARDS ── */}
          <View style={s.infoRow}>
            <View style={s.infoBox}>
              <Text style={s.infoSectionLabel}>Payment Information</Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Payment ID   </Text>
                {payment.id}
              </Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Invoice ID   </Text>
                {payment.invoiceId || "—"}
              </Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Tenant ID    </Text>
                {payment.tenantId || "—"}
              </Text>
            </View>

            <View style={s.infoBoxLast}>
              <Text style={s.infoSectionLabel}>Status Details</Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Status    </Text>
                {payment.status}
              </Text>
              <Text style={s.infoLine}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Currency  </Text>
                INR (Indian Rupee)
              </Text>
              <Text style={[s.infoLine, { marginBottom: 2 }]}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Method  </Text>
              </Text>
              <MethodBadge method={payment.method} />
            </View>
          </View>

          {/* ── TABLE ── */}
          <View style={s.tableWrap}>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colAmt]}>Amount</Text>
              <Text style={[s.th, s.colTot]}>Total</Text>
            </View>
            <View style={s.tableRow}>
              <Text style={[s.td, s.colDesc]}>Invoice Payment — {payment.invoiceId || "—"}</Text>
              <Text style={[s.td, s.colQty]}>1</Text>
              <Text style={[s.td, s.colAmt]}>{fmt(amount)}</Text>
              <Text style={[s.td, s.colTot]}>{fmt(amount)}</Text>
            </View>
          </View>

          {/* ── AMOUNT SUMMARY ── */}
          <View style={s.amountCard}>
            <View style={s.amountBox}>
              <View style={s.amountRow}>
                <Text style={s.amountLabel}>Subtotal</Text>
                <Text style={s.amountVal}>{fmt(amount)}</Text>
              </View>
              <View style={s.amountRow}>
                <Text style={s.amountLabel}>GST</Text>
                <Text style={s.amountVal}>Inclusive</Text>
              </View>
              <View style={[s.amountRow, { borderBottomWidth: 0 }]}>
                <Text style={s.amountLabel}>Currency</Text>
                <Text style={s.amountVal}>INR</Text>
              </View>
              <View style={s.totalPaidRow}>
                <Text style={s.totalPaidLabel}>Total Paid</Text>
                <Text style={s.totalPaidVal}>{fmt(amount)}</Text>
              </View>
            </View>
          </View>

          {/* ── SIGNATURE ── */}
          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Authorized Signature</Text>
            </View>
          </View>

        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Payment Receipt — Urbanfeat ERP</Text>
          <Text style={s.footerBrand}>urbanfeat.com</Text>
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

export default PaymentPDF;
