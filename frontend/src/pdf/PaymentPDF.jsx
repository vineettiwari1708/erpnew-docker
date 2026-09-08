import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";
import { fullClientName } from "../utils/clientName";

const styles = StyleSheet.create({
  page:       { padding: 30, fontSize: 10, fontFamily: "Roboto", color: "#111827" },
  header:     { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #e5e7eb", paddingBottom: 12, marginBottom: 18 },
  title:      { fontSize: 20, fontWeight: "bold" },
  logo:       { width: 55, height: 55, marginBottom: 4 },
  companyInfo:{ alignItems: "flex-end", fontSize: 9 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  box:        { width: "48%", padding: 10, border: "1 solid #e5e7eb", backgroundColor: "#f9fafb" },
  boxTitle:   { fontWeight: "bold", marginBottom: 6, fontSize: 11 },
  tableHeader:{ flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "1 solid #e5e7eb", padding: 6 },
  row:        { flexDirection: "row", borderBottom: "1 solid #f1f5f9", paddingVertical: 8, paddingHorizontal: 6 },
  th:         { flex: 1, fontWeight: "bold" },
  td:         { flex: 1 },
  right:      { textAlign: "right" },
  summaryBox: { marginTop: 20, marginLeft: "auto", width: "45%", border: "1 solid #e5e7eb", backgroundColor: "#f9fafb", padding: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  stampBox:   { marginTop: 30, alignItems: "flex-end" },
  stamp:      { border: "1 solid #111827", paddingVertical: 10, paddingHorizontal: 18, fontSize: 10 },
  footer:     { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 9, color: "#6b7280", borderTop: "1 solid #e5e7eb", paddingTop: 6 },
});

const fmt  = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

const METHOD_LABELS = {
  CASH: "Cash", UPI: "UPI", BANK_TRANSFER: "Bank Transfer", CARD: "Card", CHEQUE: "Cheque",
};

const PaymentPDF = ({ tenant, payment }) => {
  if (!payment) return null;
  const t      = tenant || {};
  const amount = Number(payment.amount || 0);
  const addr   = t.address || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
            <Text style={{ marginTop: 4 }}>Receipt #: {payment.paymentNumber || payment.id}</Text>
            <Text>Date: {fmtD(payment.paidAt || payment.confirmedAt || payment.createdAt)}</Text>
            <Text>Invoice: {payment.invoice?.invoiceNumber || payment.invoiceId || "—"}</Text>
          </View>
          <View style={styles.companyInfo}>
            {t.logoUrl ? <Image style={styles.logo} src={t.logoUrl} /> : null}
            <Text style={{ fontWeight: "bold", fontSize: 11 }}>{t.name || "—"}</Text>
            {t.email && <Text>{t.email}</Text>}
            {t.phone && <Text>{t.phone}</Text>}
            {addr.line1 && <Text>{addr.line1}</Text>}
            {addr.city  && <Text>{addr.city}{addr.state ? `, ${addr.state}` : ""}</Text>}
            {t.gstNumber && <Text>GSTIN: {t.gstNumber}</Text>}
          </View>
        </View>

        {/* PAYMENT INFO */}
        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Payment Information</Text>
            <Text>Client: {fullClientName(payment.client) || "—"}</Text>
            <Text>Invoice: {payment.invoice?.invoiceNumber || payment.invoiceId || "—"}</Text>
            <Text>Transaction ID: {payment.transactionId || "—"}</Text>
            {payment.notes && <Text>Notes: {payment.notes}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Status Details</Text>
            <Text>Status: {payment.status}</Text>
            <Text>Method: {METHOD_LABELS[payment.method] || payment.method}</Text>
            <Text>Currency: INR</Text>
            <Text>Paid On: {fmtD(payment.paidAt)}</Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, flex: 3 }}>Description</Text>
          <Text style={styles.th}>Qty</Text>
          <Text style={styles.th}>Amount</Text>
          <Text style={{ ...styles.th, ...styles.right }}>Total</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ ...styles.td, flex: 3 }}>Invoice Payment — {payment.invoice?.invoiceNumber || payment.invoiceId || "—"}</Text>
          <Text style={styles.td}>1</Text>
          <Text style={styles.td}>{fmt(amount)}</Text>
          <Text style={{ ...styles.td, ...styles.right }}>{fmt(amount)}</Text>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}><Text>Subtotal</Text><Text>{fmt(amount)}</Text></View>
          <View style={styles.summaryRow}><Text>GST</Text><Text>₹0</Text></View>
          <View style={{ ...styles.summaryRow, borderTop: "1 solid #e5e7eb", paddingTop: 5, marginTop: 3 }}>
            <Text style={{ fontWeight: "bold" }}>Total Paid</Text>
            <Text style={{ fontWeight: "bold" }}>{fmt(amount)}</Text>
          </View>
        </View>

        {/* SIGNATORY */}
        <View style={styles.stampBox}>
          <View style={styles.stamp}><Text>Authorized Signature</Text></View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `${t.name || "Payment Receipt"} • Page ${pageNumber} of ${totalPages}`
        } fixed />

      </Page>
    </Document>
  );
};

export default PaymentPDF;
