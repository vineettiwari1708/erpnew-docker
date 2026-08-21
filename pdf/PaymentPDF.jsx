import React from "react";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
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
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  companyInfo: {
    alignItems: "flex-end",
    fontSize: 10,
  },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
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
    fontSize: 11,
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
    paddingVertical: 8,
    paddingHorizontal: 6,
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

  summaryBox: {
    marginTop: 20,
    marginLeft: "auto",
    width: "45%",
    border: "1 solid #e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 10,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 9,
    color: "#6b7280",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 6,
  },

  stampBox: {
    marginTop: 30,
    alignItems: "flex-end",
  },

  stamp: {
    border: "1 solid #111827",
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 10,
  },
});

/* ================= COMPONENT ================= */

const PaymentPDF = ({ payment }) => {
  if (!payment) return null;

  const amount = Number(payment.amount || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ================= HEADER ================= */}

        <View style={styles.header}>

          <View>
            <Text style={styles.title}>
              PAYMENT RECEIPT
            </Text>

            <Text>
              Receipt #: {payment.id}
            </Text>

            <Text>
              Date:{" "}
              {payment.paymentDate
                ? new Date(
                    payment.paymentDate
                  ).toLocaleDateString()
                : "-"}
            </Text>
          </View>

          <View style={styles.companyInfo}>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 12,
              }}
            >
              Urbanfeat ERP
            </Text>

            <Text>
              support@urbanfeat.com
            </Text>

            <Text>
              +91-9876543210
            </Text>
          </View>

        </View>

        {/* ================= PAYMENT INFO ================= */}

        <View style={styles.sectionRow}>

          {/* CUSTOMER */}

          <View style={styles.box}>

            <Text style={styles.boxTitle}>
              Payment Information
            </Text>

            <Text>
              Payment ID: {payment.id}
            </Text>

            <Text>
              Invoice ID: {payment.invoiceId}
            </Text>

            <Text>
              Tenant ID: {payment.tenantId}
            </Text>

          </View>

          {/* STATUS */}

          <View style={styles.box}>

            <Text style={styles.boxTitle}>
              Status Details
            </Text>

            <Text>
              Status: {payment.status}
            </Text>

            <Text>
              Method: {payment.method}
            </Text>

            <Text>
              Currency: INR
            </Text>

          </View>

        </View>

        {/* ================= TABLE ================= */}

        <View style={styles.tableHeader}>

          <Text style={styles.th}>
            Description
          </Text>

          <Text style={styles.th}>
            Qty
          </Text>

          <Text style={styles.th}>
            Amount
          </Text>

          <Text style={styles.th}>
            Total
          </Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.td}>
            Invoice Payment
          </Text>

          <Text style={styles.td}>
            1
          </Text>

          <Text style={styles.td}>
            ₹{amount}
          </Text>

          <Text
            style={[
              styles.td,
              styles.right,
            ]}
          >
            ₹{amount}
          </Text>

        </View>

        {/* ================= SUMMARY ================= */}

        <View style={styles.summaryBox}>

          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>₹{amount}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text>GST</Text>
            <Text>₹0</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={{
                fontWeight: "bold",
              }}
            >
              Total Paid
            </Text>

            <Text
              style={{
                fontWeight: "bold",
              }}
            >
              ₹{amount}
            </Text>
          </View>

        </View>

        {/* ================= SIGNATORY ================= */}

        <View style={styles.stampBox}>

          <View style={styles.stamp}>
            <Text>
              Authorized Signature
            </Text>
          </View>

        </View>

        {/* ================= FOOTER ================= */}

        <Text
          style={styles.footer}
          render={({
            pageNumber,
            totalPages,
          }) =>
            `Payment Receipt • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />

      </Page>
    </Document>
  );
};

export default PaymentPDF;