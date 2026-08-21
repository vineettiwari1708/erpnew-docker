import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import "./pdfFonts";

const styles = StyleSheet.create({
  page:       { padding: 30, fontSize: 10, fontFamily: "Roboto", color: "#111827" },
  header:     { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #e5e7eb", paddingBottom: 12, marginBottom: 16 },
  title:      { fontSize: 18, fontWeight: "bold" },
  logo:       { width: 55, height: 55, marginBottom: 4 },
  companyInfo:{ alignItems: "flex-end", fontSize: 9 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  box:        { width: "48%", padding: 9, border: "1 solid #e5e7eb", backgroundColor: "#f9fafb" },
  boxTitle:   { fontWeight: "bold", marginBottom: 5, fontSize: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  summaryLabel:{ color: "#6b7280" },
  summaryValue:{ fontWeight: "bold" },
  tableHeader:{ flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "1 solid #e5e7eb", padding: "5 6", marginTop: 14 },
  row:        { flexDirection: "row", borderBottom: "1 solid #f1f5f9", paddingVertical: 5, paddingHorizontal: 6 },
  th:         { fontWeight: "bold" },
  right:      { textAlign: "right" },
  totalsRow:  { flexDirection: "row", borderTop: "1 solid #e5e7eb", paddingVertical: 5, paddingHorizontal: 6, backgroundColor: "#f9fafb" },
  footer:     { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 9, textAlign: "center", color: "#6b7280", borderTop: "1 solid #e5e7eb", paddingTop: 6 },
});

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

const StatementPDF = ({ tenant, statement }) => {
  if (!tenant || !statement) return null;
  const { client, invoices, summary } = statement;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ACCOUNT STATEMENT</Text>
            <Text style={{ marginTop: 4, color: "#6b7280" }}>Generated: {new Date().toLocaleDateString("en-IN")}</Text>
          </View>
          <View style={styles.companyInfo}>
            {tenant.logoUrl && <Image style={styles.logo} src={tenant.logoUrl} />}
            <Text style={{ fontWeight: "bold", fontSize: 11 }}>{tenant.name}</Text>
            {tenant.email && <Text>{tenant.email}</Text>}
            {tenant.phone && <Text>{tenant.phone}</Text>}
            {tenant.gstNumber && <Text>GSTIN: {tenant.gstNumber}</Text>}
          </View>
        </View>

        {/* CLIENT + SUMMARY */}
        <View style={styles.sectionRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Client Details</Text>
            <Text style={{ fontWeight: "bold" }}>{client.name}</Text>
            {client.company && <Text>{client.company}</Text>}
            {client.email && <Text>{client.email}</Text>}
            {client.phone && <Text>{client.phone}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total Billed</Text><Text style={styles.summaryValue}>{fmt(summary.totalBilled)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total Paid</Text><Text style={{ fontWeight: "bold", color: "#15803d" }}>{fmt(summary.totalPaid)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Outstanding</Text><Text style={{ fontWeight: "bold", color: summary.outstanding > 0 ? "#dc2626" : "#15803d" }}>{fmt(summary.outstanding)}</Text></View>
            <View style={{ ...styles.summaryRow, marginTop: 4 }}><Text style={styles.summaryLabel}>Invoices</Text><Text>{summary.invoiceCount} ({summary.paidCount} paid, {summary.overdueCount} overdue)</Text></View>
          </View>
        </View>

        {/* INVOICE TABLE */}
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, flex: 2 }}>Invoice #</Text>
          <Text style={{ ...styles.th, flex: 2 }}>Project</Text>
          <Text style={{ ...styles.th, flex: 1.5 }}>Issue Date</Text>
          <Text style={{ ...styles.th, flex: 1.5 }}>Due Date</Text>
          <Text style={{ ...styles.th, flex: 1.5, textAlign: "right" }}>Billed</Text>
          <Text style={{ ...styles.th, flex: 1.5, textAlign: "right" }}>Paid</Text>
          <Text style={{ ...styles.th, flex: 1.5, textAlign: "right" }}>Balance</Text>
          <Text style={{ ...styles.th, flex: 1 }}>Status</Text>
        </View>

        {invoices.map((inv) => {
          const paid    = inv.payments.reduce((s, p) => s + (p.amount || 0), 0);
          const balance = (inv.totalAmount || 0) - paid;
          return (
            <View key={inv.id} style={styles.row}>
              <Text style={{ flex: 2, fontSize: 9 }}>{inv.invoiceNumber || inv.id}</Text>
              <Text style={{ flex: 2 }}>{inv.project?.name || "—"}</Text>
              <Text style={{ flex: 1.5 }}>{fmtDate(inv.issueDate)}</Text>
              <Text style={{ flex: 1.5 }}>{fmtDate(inv.dueDate)}</Text>
              <Text style={{ flex: 1.5, textAlign: "right" }}>{fmt(inv.totalAmount)}</Text>
              <Text style={{ flex: 1.5, textAlign: "right", color: "#15803d" }}>{fmt(paid)}</Text>
              <Text style={{ flex: 1.5, textAlign: "right", color: balance > 0 ? "#dc2626" : "#15803d" }}>{fmt(balance)}</Text>
              <Text style={{ flex: 1 }}>{inv.status}</Text>
            </View>
          );
        })}

        {/* TOTALS ROW */}
        <View style={styles.totalsRow}>
          <Text style={{ flex: 2, fontWeight: "bold" }}>TOTAL</Text>
          <Text style={{ flex: 2 }} />
          <Text style={{ flex: 1.5 }} />
          <Text style={{ flex: 1.5 }} />
          <Text style={{ flex: 1.5, textAlign: "right", fontWeight: "bold" }}>{fmt(summary.totalBilled)}</Text>
          <Text style={{ flex: 1.5, textAlign: "right", fontWeight: "bold", color: "#15803d" }}>{fmt(summary.totalPaid)}</Text>
          <Text style={{ flex: 1.5, textAlign: "right", fontWeight: "bold", color: summary.outstanding > 0 ? "#dc2626" : "#15803d" }}>{fmt(summary.outstanding)}</Text>
          <Text style={{ flex: 1 }} />
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `${tenant.name} • Account Statement • Page ${pageNumber} of ${totalPages}`
        } fixed />

      </Page>
    </Document>
  );
};

export default StatementPDF;
