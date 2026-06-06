import PDFDocument from "pdfkit";
import type { Response } from "express";

interface ReceiptData {
  receiptNumber: string;
  gymName: string;
  gymAddress?: string;
  gymPhone?: string;
  memberName: string;
  memberPhone: string;
  planName?: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export function generateReceiptPdf(res: Response, data: ReceiptData) {
  const doc = new PDFDocument({ size: "A5", margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="receipt-${data.receiptNumber}.pdf"`
  );
  doc.pipe(res);

  const pageWidth = doc.page.width - 80;

  // Header
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text(data.gymName, { align: "center" });

  if (data.gymAddress) {
    doc.fontSize(9).font("Helvetica").text(data.gymAddress, { align: "center" });
  }
  if (data.gymPhone) {
    doc.fontSize(9).text(`Phone: ${data.gymPhone}`, { align: "center" });
  }

  doc.moveDown(0.5);
  doc
    .moveTo(40, doc.y)
    .lineTo(40 + pageWidth, doc.y)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.5);

  // Receipt title
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("PAYMENT RECEIPT", { align: "center" });
  doc.moveDown(0.3);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Receipt #: ${data.receiptNumber}`, { align: "center" });
  doc.moveDown(1);

  // Details table
  const leftCol = 40;
  const rightCol = 180;

  function row(label: string, value: string) {
    const y = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text(label, leftCol, y);
    doc.fontSize(10).font("Helvetica").text(value, rightCol, y);
    doc.moveDown(0.6);
  }

  row("Date:", data.paymentDate);
  row("Member:", data.memberName);
  row("Phone:", data.memberPhone);
  if (data.planName) {
    row("Plan:", data.planName);
  }
  row("Payment Method:", METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod);

  doc.moveDown(0.3);
  doc
    .moveTo(40, doc.y)
    .lineTo(40 + pageWidth, doc.y)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.5);

  // Amount
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`Amount Paid: ₹${Number(data.amount).toLocaleString("en-IN")}`, {
      align: "center",
    });

  doc.moveDown(1);

  if (data.notes) {
    doc.fontSize(9).font("Helvetica").text(`Notes: ${data.notes}`, leftCol);
    doc.moveDown(0.5);
  }

  // Footer
  doc
    .moveTo(40, doc.y)
    .lineTo(40 + pageWidth, doc.y)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .font("Helvetica")
    .text("This is a computer-generated receipt. No signature required.", {
      align: "center",
    });
  doc.text(`Generated on ${new Date(data.createdAt).toLocaleString("en-IN")}`, {
    align: "center",
  });

  doc.end();
}
