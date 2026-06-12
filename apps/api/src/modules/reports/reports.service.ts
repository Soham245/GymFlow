import type { Database } from "@gymflow/db";
import type { ReportQuery } from "@gymflow/shared";
import { resolveDateRange } from "../../utils/date-range.js";
import {
  revenueAnalytics,
  expenseAnalytics,
  profitAnalytics,
  membershipAnalytics,
  outstandingAnalytics,
} from "../analytics/analytics.service.js";

interface Ctx {
  db: Database;
  gymId: string;
}

function resolve(query: ReportQuery) {
  return resolveDateRange(query.period, query.from, query.to);
}

export async function revenueReport(ctx: Ctx, query: ReportQuery) {
  const range = resolve(query);
  const data = await revenueAnalytics(ctx, range);
  return {
    period: { from: range.from, to: range.to },
    totalRevenue: data.totalRevenue,
    paymentCount: data.paymentCount,
    averagePayment: data.averagePayment,
    paymentMethodBreakdown: data.paymentMethodBreakdown,
  };
}

export async function expenseReport(ctx: Ctx, query: ReportQuery) {
  const range = resolve(query);
  const data = await expenseAnalytics(ctx, range);
  return {
    period: { from: range.from, to: range.to },
    totalExpenses: data.totalExpenses,
    expenseCount: data.expenseCount,
    categoryBreakdown: data.categoryBreakdown,
  };
}

export async function profitReport(ctx: Ctx, query: ReportQuery) {
  const range = resolve(query);
  const [rev, exp] = await Promise.all([
    revenueAnalytics(ctx, range),
    expenseAnalytics(ctx, range),
  ]);
  const data = profitAnalytics(rev.totalRevenueNum, exp.totalExpensesNum);
  return {
    period: { from: range.from, to: range.to },
    revenue: data.revenue,
    expenses: data.expenses,
    profit: data.profit,
    margin: data.margin,
  };
}

export async function membershipReport(ctx: Ctx) {
  const data = await membershipAnalytics(ctx);
  return {
    summary: {
      active: data.active,
      frozen: data.frozen,
      expired: data.expired,
      cancelled: data.cancelled,
    },
    expiring7Days: data.expiring7Days,
    expiring30Days: data.expiring30Days,
    expiringMemberships: data.expiringMemberships,
  };
}

export async function outstandingBalances(ctx: Ctx) {
  const data = await outstandingAnalytics(ctx);
  return {
    totalOutstanding: data.totalOutstanding,
    count: data.membersWithDues,
    balances: data.balances,
  };
}
