import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";

const styles = StyleSheet.create({
  page:       { padding: 30, fontSize: 10, fontFamily: "Roboto", color: "#111827" },
  header:     { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #e5e7eb", paddingBottom: 12, marginBottom: 16 },
  logo:       { width: 55, height: 55, marginBottom: 4 },
  companyInfo:{ alignItems: "flex-end", fontSize: 9 },
  title:      { fontSize: 20, fontWeight: "bold" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  box:        { width: "48%", padding: 10, border: "1 solid #e5e7eb", backgroundColor: "#f9fafb" },
  boxTitle:   { fontWeight: "bold", marginBottom: 6 },
  tableHeader:{ flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "1 solid #e5e7eb", padding: 6 },
  row:        { flexDirection: "row", borderBottom: "1 solid #f1f5f9", paddingVertical: 6 },
  th:         { flex: 1, fontWeight: "bold" },
  td:         { flex: 1 },
  right:      { textAlign: "right" },
  totalBox:   { marginTop: 14, padding: 10, border: "1 solid #e5e7eb", backgroundColor: "#f9fafb", marginLeft: "auto", width: "45%" },
  totalRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  notesBox:   { marginTop: 14, padding: 8, border: "1 solid #e5e7eb" },
  stampBox:   { marginTop: 20, alignItems: "flex-end" },
  stamp:      { border: "1 solid #111827", padding: 10, fontSize: 10 },
  footer:     { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 9, textAlign: "center", color: "#6b7280", borderTop: "1 solid #e5e7eb", paddingTop: 6 },
});

const fmt   = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

const InvoicePDF = ({ tenant, invoice }) => {
  if (!invoice) return null;
  const t = tenant || {};

  const items  = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ name: invoice.title || "Service", description: null, quantity: 1, rate: invoice.amount || 0, total: invoice.amount || 0 }];

  const subtotal = Number(invoice.amount || 0);
  const tax      = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const total    = Number(invoice.totalAmount || subtotal + tax - discount);
  const balance  = invoice.status === "PAID" ? 0 : total;

  const addr = t.address || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={{ marginTop: 4 }}>Invoice #: {invoice.invoiceNumber || invoice.id}</Text>
            <Text>Date: {fmtD(invoice.issueDate)}</Text>
            <Text>Due: {fmtD(invoice.dueDate)}</Text>
            <Text>Status: {invoice.status}</Text>
          </View>
          <View style={styles.companyInfo}>
            {t.logoUrl ? <Image style={styles.logo} src={t.logoUrl} /> : null}
            <Text style={{ fontWeight: "bold", fontSize: 11 }}>{t.name || "—"}</Text>
            {t.email  && <Text>{t.email}</Text>}
            {t.phone  && <Text>{t.phone}</Text>}
            {addr.line1 && <Text>{addr.line1}</Text>}
            {addr.city  && <Text>{addr.city}{addr.state ? `, ${addr.state}` : ""}</Text>}
            {t.gstNumber && <Text>GSTIN: {t.gstNumber}</Text>}
          </View>
        </View>

        {/* BILL FROM / BILL TO */}
        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bill From</Text>
            <Text style={{ fontWeight: "bold" }}>{t.name || "—"}</Text>
            {t.email && <Text>{t.email}</Text>}
            {addr.line1 && <Text>{addr.line1}</Text>}
            {addr.city && <Text>{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.pincode || ""}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bill To</Text>
            <Text style={{ fontWeight: "bold" }}>{invoice.client?.name || "—"}</Text>
            {invoice.client?.email && <Text>{invoice.client.email}</Text>}
            {invoice.project?.name && <Text>Project: {invoice.project.name}</Text>}
          </View>
        </View>

        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, flex: 3 }}>Description</Text>
          <Text style={styles.th}>Qty</Text>
          <Text style={styles.th}>Rate</Text>
          <Text style={{ ...styles.th, ...styles.right }}>Total</Text>
        </View>

        {/* ITEMS */}
        {items.map((item, i) => (
          <View style={styles.row} key={i}>
            <View style={{ flex: 3 }}>
              <Text style={styles.td}>{item.name || item.desc || "—"}</Text>
              {item.description ? <Text style={{ fontSize: 8, color: "#6b7280" }}>{item.description}</Text> : null}
            </View>
            <Text style={styles.td}>{item.quantity ?? item.qty ?? 1}</Text>
            <Text style={styles.td}>{fmt(item.rate ?? item.price)}</Text>
            <Text style={{ ...styles.td, ...styles.right }}>{fmt(item.total ?? ((item.quantity ?? 1) * (item.rate ?? 0)))}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={styles.totalBox}>
          <View style={styles.totalRow}><Text>Subtotal</Text><Text>{fmt(subtotal)}</Text></View>
          {tax > 0     && <View style={styles.totalRow}><Text>Tax</Text><Text>{fmt(tax)}</Text></View>}
          {discount > 0 && <View style={styles.totalRow}><Text>Discount</Text><Text>-{fmt(discount)}</Text></View>}
          <View style={{ ...styles.totalRow, borderTop: "1 solid #e5e7eb", paddingTop: 5, marginTop: 3 }}>
            <Text style={{ fontWeight: "bold" }}>Total</Text>
            <Text style={{ fontWeight: "bold" }}>{fmt(total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ fontWeight: "bold" }}>Balance Due</Text>
            <Text style={{ fontWeight: "bold", color: balance > 0 ? "#dc2626" : "#15803d" }}>{fmt(balance)}</Text>
          </View>
        </View>

        {/* NOTES */}
        {invoice.notes ? (
          <View style={styles.notesBox}>
            <Text style={{ fontWeight: "bold", marginBottom: 3 }}>Notes</Text>
            <Text style={{ color: "#6b7280" }}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* STAMP */}
        <View style={styles.stampBox}>
          <View style={styles.stamp}>
            <Text>Authorized Signatory</Text>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `${t.name || "Invoice"} • Thank you for your business • Page ${pageNumber} of ${totalPages}`
        } fixed />

      </Page>
    </Document>
  );
};

export default InvoicePDF;
