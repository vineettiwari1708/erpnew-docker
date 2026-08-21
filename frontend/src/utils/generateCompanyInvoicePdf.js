// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export function generateCompanyInvoicePdf(
//   tenant,
//   invoices
// ) {
//   if (!tenant) return;

//   const doc = new jsPDF();

//   /* ================= HEADER ================= */

//   doc.setFillColor(79, 70, 229);

//   doc.rect(0, 0, 220, 30, "F");

//   doc.setFontSize(22);

//   doc.setTextColor(255, 255, 255);

//   doc.text(
//     "COMPANY INVOICE REPORT",
//     14,
//     20
//   );

//   /* ================= COMPANY DETAILS ================= */

//   doc.setFontSize(12);

//   doc.setTextColor(40);

//   doc.text(
//     `Company Name: ${tenant.name}`,
//     14,
//     45
//   );

//   doc.text(
//     `Email: ${tenant.email}`,
//     14,
//     53
//   );

//   doc.text(
//     `Phone: ${tenant.phone}`,
//     14,
//     61
//   );

//   doc.text(
//     `Website: ${tenant.website}`,
//     14,
//     69
//   );

//   doc.text(
//     `GST Number: ${tenant.gstNumber}`,
//     120,
//     45
//   );

//   doc.text(
//     `GST Type: ${tenant.gstType}`,
//     120,
//     53
//   );

//   doc.text(
//     `GST Rate: ${tenant.gstRate}%`,
//     120,
//     61
//   );

//   doc.text(
//     `Plan: ${tenant.plan}`,
//     120,
//     69
//   );

//   /* ================= ADDRESS ================= */

//   doc.setFontSize(11);

//   doc.text(
//     `Address: ${tenant.address.line1}, ${tenant.address.city}, ${tenant.address.state}, ${tenant.address.country} - ${tenant.address.pincode}`,
//     14,
//     82
//   );

//   /* ================= TABLE ================= */

//   const tableRows = invoices.map(
//     (invoice) => [
//       invoice.id,
//       invoice.tenantId,
//       invoice.clientId,
//       `${invoice.amount}`,
//       new Date(
//         invoice.dueDate
//       ).toLocaleDateString(),
//       invoice.status,
//     ]
//   );

//   autoTable(doc, {
//     startY: 92,

//     head: [
//       [
//         "Invoice ID",
//         "Tenant ID",
//         "Client ID",
//         "Amount",
//         "Due Date",
//         "Status",
//       ],
//     ],

//     body: tableRows,

//     styles: {
//       fontSize: 10,
//       cellPadding: 3,
//     },

//     headStyles: {
//       fillColor: [79, 70, 229],
//       textColor: 255,
//     },

//     alternateRowStyles: {
//       fillColor: [248, 250, 252],
//     },
//   });

//   /* ================= TOTALS ================= */

//   const totalPaid = invoices
//     .filter((i) => i.status === "PAID")
//     .reduce(
//       (sum, i) => sum + i.amount,
//       0
//     );

//   const totalPending = invoices
//     .filter((i) => i.status === "PENDING")
//     .reduce(
//       (sum, i) => sum + i.amount,
//       0
//     );

//   const finalY =
//     doc.lastAutoTable.finalY + 15;

//   doc.setFontSize(12);

//   doc.setTextColor(0, 0, 0);

//   doc.text(
//     `Total Invoices: ${invoices.length}`,
//     14,
//     finalY
//   );

//   doc.setTextColor(22, 163, 74);

//   doc.text(
//     `Total Paid: ${totalPaid}`,
//     14,
//     finalY + 10
//   );

//   doc.setTextColor(202, 138, 4);

//   doc.text(
//     `Total Pending: ${totalPending}`,
//     14,
//     finalY + 20
//   );

//   /* ================= FOOTER ================= */

//   doc.setTextColor(100);

//   doc.setFontSize(10);

//   doc.text(
//     `Generated on ${new Date().toLocaleString()}`,
//     14,
//     finalY + 40
//   );

//   doc.text(
//     "System Admin Invoice Report",
//     14,
//     finalY + 48
//   );

//   /* ================= SAVE ================= */

// //   doc.save(
// //     `${tenant.name}-invoice-report.pdf`
// //   );

// const pdfBlob = doc.output("blob");

// const pdfUrl = URL.createObjectURL(pdfBlob);

// window.open(pdfUrl, "_blank");
// }






import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateCompanyInvoicePdf(
  tenant,
  invoices
) {
  if (!tenant) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW =
    doc.internal.pageSize.getWidth();

  const margin = 14;

  /* ================= HEADER ================= */

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);

  doc.text(
    "COMPANY INVOICE REPORT",
    margin,
    18
  );

  /* ================= COMPANY CARD ================= */

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 38, pageW - 28, 38, "F");

  doc.setTextColor(30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  doc.text(tenant.name, margin + 6, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    tenant.email,
    margin + 6,
    54
  );

  doc.text(
    tenant.phone,
    margin + 6,
    60
  );

  doc.text(
    tenant.website || "-",
    margin + 6,
    66
  );

  /* ================= RIGHT SIDE INFO ================= */

  const rightX = 140;

  doc.setFont("helvetica", "bold");

  doc.text("GST", rightX, 48);
  doc.text("Plan", rightX, 54);
  doc.text("Rate", rightX, 60);

  doc.setFont("helvetica", "normal");

  doc.text(tenant.gstNumber || "-", rightX + 25, 48);
  doc.text(tenant.plan || "-", rightX + 25, 54);
  doc.text(`${tenant.gstRate}%`, rightX + 25, 60);

  /* ================= ADDRESS ================= */

  doc.setFontSize(9);

  doc.text(
    `${tenant.address.line1}, ${tenant.address.city}, ${tenant.address.state}`,
    margin,
    85
  );

  doc.text(
    `${tenant.address.country} - ${tenant.address.pincode}`,
    margin,
    90
  );

  /* ================= TABLE TITLE ================= */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text("INVOICE LIST", margin, 102);

  /* ================= TABLE ================= */

 const tableRows = (invoices || []).map((invoice) => [
  invoice?.id || "-",
  invoice?.clientId || "-",
  invoice?.amount != null
    ? `${invoice.amount}/-`
    : "0/-",
  invoice?.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString()
    : "-",
  invoice?.status || "-",
]);

autoTable(doc, {
  startY: 108,
  margin: { left: 14, right: 14 },

  theme: "grid",

  head: [
    [
      "Invoice ID",
      "Client ID",
      "Amount",
      "Due Date",
      "Status",
    ],
  ],

  body: tableRows,

  styles: {
    font: "helvetica",
    fontSize: 9,
    cellPadding: 4,
    textColor: 40,
    lineColor: [220, 220, 220],
    lineWidth: 0.2,
  },

  headStyles: {
    fillColor: [79, 70, 229],
    textColor: 255,
  },

  columnStyles: {
    2: { halign: "right" },
    4: { halign: "center" },
  },
});
  /* ================= SUMMARY ================= */

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.amount), 0);

  const totalPending = invoices
    .filter((i) => i.status === "PENDING")
    .reduce((s, i) => s + Number(i.amount), 0);

  const finalY =
    doc.lastAutoTable.finalY + 12;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, finalY, pageW - 28, 28, "F");

  doc.setFontSize(10);
  doc.setTextColor(40);

  doc.text(
    `Total Invoices: ${invoices.length}`,
    margin + 6,
    finalY + 10
  );

  doc.setTextColor(22, 163, 74);
  doc.text(
    `Paid: ₹${totalPaid}`,
    margin + 6,
    finalY + 18
  );

  doc.setTextColor(202, 138, 4);
  doc.text(
    `Pending: ₹${totalPending}`,
    margin + 80,
    finalY + 18
  );

  /* ================= FOOTER ================= */

  doc.setTextColor(120);
  doc.setFontSize(9);

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    margin,
    285
  );

  doc.text(
    "System Admin Report",
    pageW - margin,
    285,
    { align: "right" }
  );

  /* ================= OPEN ================= */

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");
}