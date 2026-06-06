// Column definitions for CSV/XLSX exports — centralized so both formats share definitions

export const memberColumns = [
  { header: "Name", key: "name" },
  { header: "Phone", key: "phone" },
  { header: "Email", key: "email" },
  { header: "Gender", key: "gender" },
  { header: "Date of Birth", key: "dateOfBirth" },
  { header: "Address", key: "address" },
  { header: "Join Date", key: "joinDate" },
  { header: "Status", key: "status" },
  { header: "Emergency Contact", key: "emergencyContactName" },
  { header: "Emergency Phone", key: "emergencyContactPhone" },
];

export const revenueColumns = [
  { header: "Receipt #", key: "receiptNumber" },
  { header: "Member", key: "memberName" },
  { header: "Phone", key: "memberPhone" },
  { header: "Amount", key: "amount" },
  { header: "Method", key: "paymentMethod" },
  { header: "Status", key: "paymentStatus" },
  { header: "Date", key: "paymentDate" },
  { header: "Notes", key: "notes" },
];

export const expenseColumns = [
  { header: "Category", key: "categoryName" },
  { header: "Amount", key: "amount" },
  { header: "Description", key: "description" },
  { header: "Date", key: "expenseDate" },
  { header: "Payment Method", key: "paymentMethod" },
];

export const outstandingColumns = [
  { header: "Member", key: "memberName" },
  { header: "Phone", key: "memberPhone" },
  { header: "Plan", key: "planName" },
  { header: "Total", key: "totalAmount" },
  { header: "Discount", key: "discountAmount" },
  { header: "Paid", key: "paidAmount" },
  { header: "Outstanding", key: "outstanding" },
  { header: "Status", key: "status" },
  { header: "End Date", key: "endDate" },
];
