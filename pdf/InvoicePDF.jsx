import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #e5e7eb",
    paddingBottom: 10,
    marginBottom: 15,
  },

  logo: {
    width: 60,
    height: 60,
  },

  companyInfo: {
    fontSize: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  box: {
    width: "48%",
    padding: 10,
    border: "1 solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },

  boxTitle: {
    fontWeight: "bold",
    marginBottom: 6,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: "1 solid #e5e7eb",
    padding: 6,
  },

  row: {
    flexDirection: "row",
    borderBottom: "1 solid #f1f5f9",
    paddingVertical: 6,
  },

  th: {
    flex: 1,
    fontWeight: "bold",
  },

  td: {
    flex: 1,
  },

  right: {
    textAlign: "right",
  },

  totalBox: {
    marginTop: 15,
    padding: 10,
    border: "1 solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 9,
    textAlign: "center",
    color: "#6b7280",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 6,
  },

  stampBox: {
    marginTop: 20,
    alignItems: "flex-end",
  },

  stamp: {
    border: "1 solid #111827",
    padding: 10,
    fontSize: 10,
  },
});

/* ================= COMPONENT ================= */

const InvoicePDF = ({ tenant, invoice }) => {
  if (!tenant || !invoice) return null;

  const amount = Number(invoice.amount || 0);

  // GST calculation (example 18%)
  const gstRate = 18;
  const gst = (amount * gstRate) / 100;
  const cgst = gst / 2;
  const sgst = gst / 2;

  const total = amount + gst;
  const balanceDue = invoice.status === "PAID" ? 0 : total;

  const items = [
    {
      desc: "Software Subscription Plan",
      qty: 1,
      price: amount,
    },
    {
      desc: "Support & Maintenance",
      qty: 1,
      price: 0,
    },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>

          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text>Invoice #: {invoice.id}</Text>
            <Text>Date: {new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.companyInfo}>
            {tenant.logo && (
              <Image style={styles.logo} src={tenant.logo} />
            )}
            <Text style={{ fontWeight: "bold" }}>
              {tenant.name}
            </Text>
            <Text>{tenant.email}</Text>
            <Text>{tenant.phone}</Text>
          </View>

        </View>

        {/* BILLING INFO */}
        <View style={styles.sectionRow}>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Bill To</Text>
            <Text>{tenant.name}</Text>
            <Text>{tenant.address.line1}</Text>
            <Text>
              {tenant.address.city}, {tenant.address.state}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Invoice Details</Text>
            <Text>Status: {invoice.status}</Text>
            <Text>
              Due: {new Date(invoice.dueDate).toLocaleDateString()}
            </Text>
            <Text>GST Rate: {gstRate}%</Text>
          </View>

        </View>

        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <Text style={styles.th}>Description</Text>
          <Text style={styles.th}>Qty</Text>
          <Text style={styles.th}>Price</Text>
          <Text style={styles.th}>Total</Text>
        </View>

        {/* TABLE ROWS */}
        {items.map((item, index) => (
          <View style={styles.row} key={index}>
            <Text style={styles.td}>{item.desc}</Text>
            <Text style={styles.td}>{item.qty}</Text>
            <Text style={styles.td}>{item.price}/-</Text>
            <Text style={[styles.td, styles.right]}>
              {item.qty * item.price}/-
            </Text>
          </View>
        ))}

        {/* GST BREAKDOWN */}
        <View style={styles.totalBox}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text style={styles.right}>{amount}/-</Text>
          </View>

          <View style={styles.row}>
            <Text>CGST (9%)</Text>
            <Text style={styles.right}>{cgst}/-</Text>
          </View>

          <View style={styles.row}>
            <Text>SGST (9%)</Text>
            <Text style={styles.right}>{sgst}/-</Text>
          </View>

          <View style={styles.row}>
            <Text>Total</Text>
            <Text style={styles.right}>{total}/-</Text>
          </View>

          <View style={styles.row}>
            <Text>Balance Due</Text>
            <Text style={styles.right}>{balanceDue}/-</Text>
          </View>
        </View>

        {/* STAMP */}
        <View style={styles.stampBox}>
          <View style={styles.stamp}>
            <Text>Authorized Signatory</Text>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `Thank you for your business • Page ${pageNumber} of ${totalPages}`
        } fixed />

      </Page>
    </Document>
  );
};

export default InvoicePDF;