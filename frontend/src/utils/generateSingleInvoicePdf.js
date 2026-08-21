// import jsPDF from "jspdf";

// export function generateSingleInvoicePdf(
//   tenant,
//   invoice
// ) {
//   if (!tenant || !invoice) return;

//   const doc = new jsPDF();

//   /* ================= HEADER ================= */

//   doc.setFillColor(79, 70, 229);

//   doc.rect(0, 0, 220, 35, "F");

//   doc.setFontSize(22);

//   doc.setTextColor(255, 255, 255);

//   doc.text("INVOICE", 14, 22);

//   /* ================= COMPANY INFO ================= */

//   doc.setTextColor(40);

//   doc.setFontSize(12);

//   doc.text(
//     `Company: ${tenant.name}`,
//     14,
//     50
//   );

//   doc.text(
//     `Email: ${tenant.email}`,
//     14,
//     58
//   );

//   doc.text(
//     `Phone: ${tenant.phone}`,
//     14,
//     66
//   );

//   doc.text(
//     `GST Number: ${tenant.gstNumber}`,
//     120,
//     50
//   );

//   doc.text(
//     `GST Type: ${tenant.gstType}`,
//     120,
//     58
//   );

//   doc.text(
//     `GST Rate: ${tenant.gstRate}%`,
//     120,
//     66
//   );

//   /* ================= ADDRESS ================= */

//   doc.setFontSize(11);

//   doc.text(
//     `Address: ${tenant.address.line1}, ${tenant.address.city}, ${tenant.address.state}, ${tenant.address.country} - ${tenant.address.pincode}`,
//     14,
//     80
//   );

//   /* ================= DIVIDER ================= */

//   doc.setDrawColor(200);

//   doc.line(14, 90, 195, 90);

//   /* ================= INVOICE DETAILS ================= */

//   doc.setFontSize(16);

//   doc.text("Invoice Details", 14, 105);

//   doc.setFontSize(12);

//   doc.text(
//     `Invoice ID: ${invoice.id}`,
//     14,
//     118
//   );

//   doc.text(
//     `Tenant ID: ${invoice.tenantId}`,
//     14,
//     128
//   );

//   doc.text(
//     `Client ID: ${invoice.clientId}`,
//     14,
//     138
//   );

//   doc.text(
//     `Due Date: ${new Date(
//       invoice.dueDate
//     ).toLocaleDateString()}`,
//     14,
//     148
//   );

//   doc.text(
//     `Status: ${invoice.status}`,
//     14,
//     158
//   );

//   /* ================= AMOUNT BOX ================= */

//   doc.setFillColor(248, 250, 252);

//   doc.roundedRect(
//     14,
//     175,
//     180,
//     40,
//     4,
//     4,
//     "F"
//   );

//   doc.setFontSize(14);

//   doc.text(
//     "Total Amount",
//     20,
//     192
//   );

//   doc.setFontSize(24);

//   doc.setTextColor(79, 70, 229);

//   doc.text(
//     `₹${invoice.amount}`,
//     20,
//     207
//   );

//   /* ================= FOOTER ================= */

//   doc.setTextColor(100);

//   doc.setFontSize(10);

//   doc.text(
//     `Generated on ${new Date().toLocaleString()}`,
//     14,
//     260
//   );

//   doc.text(
//     "System Admin Invoice",
//     14,
//     268
//   );

//   /* ================= PREVIEW ================= */

//   const pdfBlob = doc.output("blob");

//   const pdfUrl =
//     URL.createObjectURL(pdfBlob);

//   window.open(pdfUrl, "_blank");
// }










// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export function generateSingleInvoicePdf(
//   tenant,
//   invoice
// ) {
//   if (!tenant || !invoice) return;

//   const doc = new jsPDF();

//   /* ================= COLORS ================= */

//   const primary = [79, 70, 229];
//   const dark = [30, 41, 59];
//   const gray = [100, 116, 139];
//   const lightGray = [241, 245, 249];
//   const green = [22, 163, 74];
//   const yellow = [202, 138, 4];

//   /* ================= HEADER ================= */

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(28);
//   doc.setTextColor(...primary);

//   doc.text("INVOICE", 14, 22);

//   /* ================= COMPANY INFO ================= */

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(16);
//   doc.setTextColor(...dark);

//   doc.text(tenant.name, 14, 38);

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(11);
//   doc.setTextColor(...gray);

//   doc.text(tenant.email, 14, 46);

//   doc.text(tenant.phone, 14, 53);

//   doc.text(tenant.website, 14, 60);

//   doc.text(
//     `${tenant.address.line1}`,
//     14,
//     67
//   );

//   doc.text(
//     `${tenant.address.city}, ${tenant.address.state}`,
//     14,
//     74
//   );

//   doc.text(
//     `${tenant.address.country} - ${tenant.address.pincode}`,
//     14,
//     81
//   );

//   /* ================= INVOICE INFO ================= */

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(11);
//   doc.setTextColor(...dark);

//   doc.text("Invoice ID", 140, 40);
//   doc.text("Due Date", 140, 50);
//   doc.text("Status", 140, 60);
//   doc.text("GST Number", 140, 70);

//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...gray);

//   doc.text(`${invoice.id}`, 175, 40);

//   doc.text(
//     new Date(
//       invoice.dueDate
//     ).toLocaleDateString(),
//     175,
//     50
//   );

//   doc.setTextColor(
//     ...(invoice.status === "PAID"
//       ? green
//       : yellow)
//   );

//   doc.text(`${invoice.status}`, 175, 60);

//   doc.setTextColor(...gray);

//   doc.text(
//     `${tenant.gstNumber}`,
//     175,
//     70
//   );

//   /* ================= DIVIDER ================= */

//   doc.setDrawColor(220);

//   doc.line(14, 92, 196, 92);

//   /* ================= BILL TO ================= */

//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(...dark);
//   doc.setFontSize(13);

//   doc.text("Bill To", 14, 108);

//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...gray);
//   doc.setFontSize(11);

//   doc.text(
//     `Client ID: ${invoice.clientId}`,
//     14,
//     118
//   );

//   /* ================= TABLE ================= */

//   autoTable(doc, {
//     startY: 130,

//     head: [
//       [
//         "Description",
//         "Qty",
//         "Rate",
//         "GST",
//         "Amount",
//       ],
//     ],

//     body: [
//       [
//         "Software Subscription",
//         "1",
//         `₹${invoice.amount}`,
//         `${tenant.gstRate}%`,
//         `₹${invoice.amount}`,
//       ],
//     ],

//     theme: "plain",

//     headStyles: {
//       fillColor: primary,
//       textColor: 255,
//       fontStyle: "bold",
//       halign: "left",
//     },

//     bodyStyles: {
//       textColor: dark,
//     },

//     alternateRowStyles: {
//       fillColor: lightGray,
//     },

//     styles: {
//       fontSize: 11,
//       cellPadding: 6,
//       lineWidth: 0.2,
//       lineColor: [230, 230, 230],
//     },

//     columnStyles: {
//       1: { halign: "center" },
//       2: { halign: "right" },
//       3: { halign: "right" },
//       4: { halign: "right" },
//     },
//   });

//   /* ================= TOTAL BOX ================= */

//   const finalY =
//     doc.lastAutoTable.finalY + 18;

//   doc.setFillColor(...lightGray);

//   doc.roundedRect(
//     125,
//     finalY,
//     70,
//     32,
//     3,
//     3,
//     "F"
//   );

//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(...dark);
//   doc.setFontSize(12);

//   doc.text("Total", 135, finalY + 12);

//   doc.setFontSize(18);
//   doc.setTextColor(...primary);

//   doc.text(
//     `₹${invoice.amount}`,
//     135,
//     finalY + 25
//   );

//   /* ================= NOTES ================= */

//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(...dark);
//   doc.setFontSize(12);

//   doc.text("Notes", 14, finalY + 20);

//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...gray);
//   doc.setFontSize(10);

//   doc.text(
//     "Thank you for your business.",
//     14,
//     finalY + 30
//   );

//   doc.text(
//     "This is a system generated invoice.",
//     14,
//     finalY + 38
//   );

//   /* ================= FOOTER ================= */

//   doc.setDrawColor(230);

//   doc.line(14, 270, 196, 270);

//   doc.setFontSize(9);
//   doc.setTextColor(...gray);

//   doc.text(
//     `Generated on ${new Date().toLocaleString()}`,
//     14,
//     278
//   );

//   doc.text(
//     tenant.name,
//     170,
//     278
//   );

//   /* ================= PREVIEW ================= */

//   const pdfBlob = doc.output("blob");

//   const pdfUrl =
//     URL.createObjectURL(pdfBlob);

//   window.open(pdfUrl, "_blank");
// }





// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export function generateSingleInvoicePdf(
//   tenant,
//   invoice
// ) {
//   if (!tenant || !invoice) return;

//   /* ================= PDF ================= */

//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4",
//   });

//   const pageWidth =
//     doc.internal.pageSize.getWidth();

//   const margin = 8;

//   /* ================= HEADER ================= */

//   doc.setFont("helvetica", "bold");

//   doc.setFontSize(26);

//   doc.text(
//     "INVOICE",
//     margin,
//     18
//   );

//   /* ================= COMPANY LEFT ================= */

//   doc.setFontSize(13);

//   doc.text(
//     tenant.name,
//     margin,
//     32
//   );

//   doc.setFont("helvetica", "normal");

//   doc.setFontSize(9.5);

//   let y = 39;

//   [
//     tenant.email,
//     tenant.phone,
//     tenant.website,
//     tenant.address.line1,
//     `${tenant.address.city}, ${tenant.address.state}`,
//     `${tenant.address.country} - ${tenant.address.pincode}`,
//   ].forEach((line) => {
//     if (line) {
//       doc.text(line, margin, y);
//       y += 5;
//     }
//   });

//   /* ================= RIGHT INFO ================= */

//   const labelX = 145;
//   const valueX = 176;

//   doc.setFont("helvetica", "bold");

//   doc.text("Invoice #", labelX, 32);

//   doc.text("Issue Date", labelX, 39);

//   doc.text("Due Date", labelX, 46);

//   doc.text("Status", labelX, 53);

//   doc.text("GSTIN", labelX, 60);

//   doc.setFont("helvetica", "normal");

//   doc.text(
//     invoice.id,
//     valueX,
//     32,
//     {
//       align: "right",
//     }
//   );

//   doc.text(
//     new Date().toLocaleDateString(),
//     valueX,
//     39,
//     {
//       align: "right",
//     }
//   );

//   doc.text(
//     new Date(
//       invoice.dueDate
//     ).toLocaleDateString(),
//     valueX,
//     46,
//     {
//       align: "right",
//     }
//   );

//   doc.text(
//     invoice.status,
//     valueX,
//     53,
//     {
//       align: "right",
//     }
//   );

//   doc.text(
//     tenant.gstNumber || "-",
//     valueX,
//     60,
//     {
//       align: "right",
//     }
//   );

//   /* ================= DIVIDER ================= */

//   doc.setLineWidth(0.3);

//   doc.line(8, 72, 202, 72);

//   /* ================= BILL TO ================= */

//   doc.setFont("helvetica", "bold");

//   doc.setFontSize(10);

//   doc.text(
//     "BILLED TO",
//     margin,
//     83
//   );

//   doc.setFont("helvetica", "normal");

//   doc.setFontSize(9.5);

//   doc.text(
//     `Client ID: ${invoice.clientId}`,
//     margin,
//     90
//   );

//   /* ================= TABLE ================= */

//   autoTable(doc, {
//     startY: 98,

//     margin: {
//       left: 8,
//       right: 8,
//     },

//     theme: "plain",

//     styles: {
//       font: "helvetica",
//       fontSize: 9.5,
//       textColor: 20,
//       lineColor: 220,
//       lineWidth: 0.2,
//       cellPadding: {
//         top: 4,
//         right: 3,
//         bottom: 4,
//         left: 3,
//       },
//     },

//     headStyles: {
//       fontStyle: "bold",
//       textColor: 0,
//       fillColor: false,
//       lineWidth: 0.3,
//       lineColor: 180,
//     },

//     bodyStyles: {
//       lineWidth: 0.2,
//       lineColor: 230,
//     },

//     head: [
//       [
//         "DESCRIPTION",
//         "QTY",
//         "RATE",
//         "GST",
//         "AMOUNT",
//       ],
//     ],

//     body: [
//       [
//         "Software Subscription",
//         "1",
//         `₹${invoice.amount}`,
//         `${tenant.gstRate}%`,
//         `₹${invoice.amount}`,
//       ],
//     ],

//     columnStyles: {
//       0: {
//         cellWidth: 90,
//       },

//       1: {
//         halign: "center",
//         cellWidth: 20,
//       },

//       2: {
//         halign: "right",
//       },

//       3: {
//         halign: "right",
//       },

//       4: {
//         halign: "right",
//       },
//     },
//   });

//   /* ================= TOTALS ================= */

//   const finalY =
//     doc.lastAutoTable.finalY + 12;

//   doc.setLineWidth(0.3);

//   doc.line(
//     130,
//     finalY - 6,
//     202,
//     finalY - 6
//   );

//   doc.setFont("helvetica", "normal");

//   doc.setFontSize(10);

//   doc.text(
//     "Subtotal",
//     145,
//     finalY
//   );

//   doc.text(
//     `₹${invoice.amount}`,
//     194,
//     finalY,
//     {
//       align: "right",
//     }
//   );

//   doc.text(
//     `GST (${tenant.gstRate}%)`,
//     145,
//     finalY + 7
//   );

//   doc.text(
//     "Included",
//     194,
//     finalY + 7,
//     {
//       align: "right",
//     }
//   );

//   doc.setFont("helvetica", "bold");

//   doc.setFontSize(13);

//   doc.text(
//     "Total",
//     145,
//     finalY + 18
//   );

//   doc.text(
//     `₹${invoice.amount}`,
//     194,
//     finalY + 18,
//     {
//       align: "right",
//     }
//   );

//   /* ================= NOTES ================= */

//   doc.setFont("helvetica", "bold");

//   doc.setFontSize(10);

//   doc.text(
//     "Notes",
//     margin,
//     finalY + 35
//   );

//   doc.setFont("helvetica", "normal");

//   doc.setFontSize(9);

//   doc.text(
//     "Thank you for your business.",
//     margin,
//     finalY + 42
//   );

//   /* ================= FOOTER ================= */

//   doc.setLineWidth(0.2);

//   doc.line(
//     8,
//     280,
//     202,
//     280
//   );

//   doc.setFontSize(8);

//   doc.text(
//     `Generated on ${new Date().toLocaleString()}`,
//     margin,
//     285
//   );

//   doc.text(
//     tenant.name,
//     194,
//     285,
//     {
//       align: "right",
//     }
//   );

//   /* ================= DIRECT PRINT ================= */

//   doc.autoPrint();

//   const blobURL =
//     doc.output("bloburl");

//   window.open(blobURL);
// }




import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateSingleInvoicePdf(
  tenant,
  invoice
) {
  if (!tenant || !invoice) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  const amount = Number(invoice.amount || 0);
  const balanceDue =
    invoice.status === "PAID" ? 0 : amount;

  /* ================= HEADER ================= */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("INVOICE", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    margin,
    24
  );

  /* ================= COMPANY LEFT ================= */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(tenant.name, margin, 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let y = 42;

  [
    tenant.email,
    tenant.phone,
    tenant.website,
    tenant.address.line1,
    `${tenant.address.city}, ${tenant.address.state}`,
    `${tenant.address.country} - ${tenant.address.pincode}`,
  ].forEach((t) => {
    doc.text(t || "-", margin, y);
    y += 5;
  });

  /* ================= RIGHT BOX (STRICT ALIGNMENT) ================= */

  const labelX = 130;
  const valueX = 190;

  doc.setFillColor(245, 247, 250);
  doc.rect(125, 28, 75, 35, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text("Invoice ID", labelX, 36);
  doc.text("Date", labelX, 42);
  doc.text("Due Date", labelX, 48);
  doc.text("Status", labelX, 54);

  doc.setFont("helvetica", "normal");

  doc.text(invoice.id, valueX, 36, {
    align: "right",
  });

  doc.text(
    new Date().toLocaleDateString(),
    valueX,
    42,
    { align: "right" }
  );

  doc.text(
    new Date(invoice.dueDate).toLocaleDateString(),
    valueX,
    48,
    { align: "right" }
  );

  doc.text(invoice.status, valueX, 54, {
    align: "right",
  });

  /* ================= DIVIDER ================= */

  doc.line(14, 70, pageW - 14, 70);

  /* ================= ITEMS ================= */

  doc.setFont("helvetica", "bold");
  doc.text("ITEM DETAILS", margin, 78);

  autoTable(doc, {
    startY: 82,
    margin: { left: margin, right: margin },

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: 40,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },

    headStyles: {
      fillColor: [245, 247, 250],
      textColor: 40,
      fontStyle: "bold",
    },

    head: [["#", "Description", "Amount"]],

    body: [
      [
        "1",
        "Software Subscription - Monthly Plan",
        amount,
      ],
    ],

    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "left" },
      2: { halign: "right", cellWidth: 40 },
    },
  });

  /* ================= TOTAL BOX ================= */

  const yPos = doc.lastAutoTable.finalY + 12;

  const boxX = 120;

  doc.setFillColor(245, 247, 250);
  doc.rect(boxX, yPos, 80, 30, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text("Subtotal", boxX + 6, yPos + 10);
  doc.text(`${amount}`, 190, yPos + 10, {
    align: "right",
  });

  doc.text("Tax", boxX + 6, yPos + 16);
  doc.text("Included", 190, yPos + 16, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", boxX + 6, yPos + 24);
  doc.text(`${amount}`, 190, yPos + 24, {
    align: "right",
  });

  /* ================= BALANCE ================= */

  doc.setFillColor(241, 245, 249); // light gray background (slate-100)
doc.rect(boxX, yPos + 32, 80, 12, "F");

doc.setTextColor(71, 85, 105); // dark gray text (slate-600)
doc.setFont("helvetica", "bold");

doc.text("BALANCE DUE", boxX + 6, yPos + 40);

doc.setFont("helvetica", "bold");
doc.setTextColor(30, 41, 59); // slightly darker for amount

doc.text(
  `${balanceDue}`,
  190,
  yPos + 40,
  { align: "right" }
);

doc.setTextColor(40); // reset

  /* ================= FOOTER ================= */

  doc.setFontSize(8);
  doc.text(
    "This is a system generated invoice.",
    margin,
    285
  );

  doc.text(
    tenant.name,
    190,
    285,
    { align: "right" }
  );

  doc.autoPrint();

  window.open(doc.output("bloburl"));
}