type AnalyticsData = {
  period: { from: string; to: string; range: string };
  revenue: { totalRevenue: string; paymentCount: number; averagePayment: string };
  expenses: { totalExpenses: string; expenseCount: number };
  profit: { revenue: string; expenses: string; profit: string; margin: number };
  outstanding: { totalOutstanding: string; membersWithDues: number };
  memberships: { active: number; frozen: number; expired: number; cancelled: number; expiring7Days: number; expiring30Days: number };
  trends: Array<{ month: string; revenue: string; expenses: string; profit: string }>;
};

export const analyticsExportColumns = [
  { header: "Section", key: "section" },
  { header: "Metric", key: "metric" },
  { header: "Value", key: "value" },
];

export function flattenAnalyticsForExport(data: AnalyticsData): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  rows.push({ section: "Period", metric: "From", value: data.period.from });
  rows.push({ section: "Period", metric: "To", value: data.period.to });
  rows.push({ section: "Period", metric: "Range", value: data.period.range });

  rows.push({ section: "Revenue", metric: "Total Revenue", value: data.revenue.totalRevenue });
  rows.push({ section: "Revenue", metric: "Payment Count", value: String(data.revenue.paymentCount) });
  rows.push({ section: "Revenue", metric: "Average Payment", value: data.revenue.averagePayment });

  rows.push({ section: "Expenses", metric: "Total Expenses", value: data.expenses.totalExpenses });
  rows.push({ section: "Expenses", metric: "Expense Count", value: String(data.expenses.expenseCount) });

  rows.push({ section: "Profit", metric: "Revenue", value: data.profit.revenue });
  rows.push({ section: "Profit", metric: "Expenses", value: data.profit.expenses });
  rows.push({ section: "Profit", metric: "Profit", value: data.profit.profit });
  rows.push({ section: "Profit", metric: "Margin %", value: String(data.profit.margin) });

  rows.push({ section: "Outstanding", metric: "Total Outstanding", value: data.outstanding.totalOutstanding });
  rows.push({ section: "Outstanding", metric: "Members with Dues", value: String(data.outstanding.membersWithDues) });

  rows.push({ section: "Memberships", metric: "Active", value: String(data.memberships.active) });
  rows.push({ section: "Memberships", metric: "Frozen", value: String(data.memberships.frozen) });
  rows.push({ section: "Memberships", metric: "Expired", value: String(data.memberships.expired) });
  rows.push({ section: "Memberships", metric: "Cancelled", value: String(data.memberships.cancelled) });
  rows.push({ section: "Memberships", metric: "Expiring in 7 Days", value: String(data.memberships.expiring7Days) });
  rows.push({ section: "Memberships", metric: "Expiring in 30 Days", value: String(data.memberships.expiring30Days) });

  for (const t of data.trends) {
    rows.push({ section: `Trend: ${t.month}`, metric: "Revenue", value: t.revenue });
    rows.push({ section: `Trend: ${t.month}`, metric: "Expenses", value: t.expenses });
    rows.push({ section: `Trend: ${t.month}`, metric: "Profit", value: t.profit });
  }

  return rows;
}
