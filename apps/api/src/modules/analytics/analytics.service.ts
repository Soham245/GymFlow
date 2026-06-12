import { eq, and, gte, lte, count, sum, desc, sql } from "drizzle-orm";
import {
  payments,
  expenses,
  expenseCategories,
  members,
  memberMemberships,
  membershipPlans,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import { toMoney } from "../../utils/money.js";
import { resolveDateRange, previousDateRange, type DateRange } from "../../utils/date-range.js";
import type { ReportPeriod } from "@gymflow/shared";

interface Ctx {
  db: Database;
  gymId: string;
}

export interface AnalyticsFilter {
  range: ReportPeriod;
  from?: string;
  to?: string;
}

function resolve(filter: AnalyticsFilter): DateRange {
  return resolveDateRange(filter.range, filter.from, filter.to);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

function futureStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Revenue Analytics ─────────────────────────────────────────

export async function revenueAnalytics(ctx: Ctx, range: DateRange) {
  const { db, gymId } = ctx;

  const [totals, methodBreakdown] = await Promise.all([
    db
      .select({
        totalRevenue: sum(payments.amount),
        paymentCount: count(),
      })
      .from(payments)
      .where(
        and(
          eq(payments.gymId, gymId),
          gte(payments.paymentDate, range.from),
          lte(payments.paymentDate, range.to)
        )
      ),
    db
      .select({
        method: payments.paymentMethod,
        total: sum(payments.amount),
        cnt: count(),
      })
      .from(payments)
      .where(
        and(
          eq(payments.gymId, gymId),
          gte(payments.paymentDate, range.from),
          lte(payments.paymentDate, range.to)
        )
      )
      .groupBy(payments.paymentMethod)
      .orderBy(desc(sum(payments.amount))),
  ]);

  const totalRevenue = Number(totals[0]?.totalRevenue ?? 0);
  const paymentCount = totals[0]?.paymentCount ?? 0;

  return {
    totalRevenue: toMoney(totalRevenue),
    totalRevenueNum: totalRevenue,
    paymentCount,
    averagePayment: toMoney(paymentCount > 0 ? totalRevenue / paymentCount : 0),
    paymentMethodBreakdown: methodBreakdown.map((m) => ({
      method: m.method,
      total: toMoney(m.total),
      count: m.cnt,
    })),
  };
}

// ─── Expense Analytics ─────────────────────────────────────────

export async function expenseAnalytics(ctx: Ctx, range: DateRange) {
  const { db, gymId } = ctx;

  const [totals, categoryBreakdown] = await Promise.all([
    db
      .select({ totalExpenses: sum(expenses.amount), expenseCount: count() })
      .from(expenses)
      .where(
        and(
          eq(expenses.gymId, gymId),
          gte(expenses.expenseDate, range.from),
          lte(expenses.expenseDate, range.to)
        )
      ),
    db
      .select({
        categoryName: expenseCategories.name,
        total: sum(expenses.amount),
        cnt: count(),
      })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(
        and(
          eq(expenses.gymId, gymId),
          gte(expenses.expenseDate, range.from),
          lte(expenses.expenseDate, range.to)
        )
      )
      .groupBy(expenseCategories.name)
      .orderBy(desc(sum(expenses.amount))),
  ]);

  const totalExpenses = Number(totals[0]?.totalExpenses ?? 0);

  return {
    totalExpenses: toMoney(totalExpenses),
    totalExpensesNum: totalExpenses,
    expenseCount: totals[0]?.expenseCount ?? 0,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.categoryName,
      total: toMoney(c.total),
      count: c.cnt,
    })),
  };
}

// ─── Profit Analytics ──────────────────────────────────────────

export function profitAnalytics(revenueNum: number, expensesNum: number) {
  const profit = revenueNum - expensesNum;
  return {
    revenue: toMoney(revenueNum),
    expenses: toMoney(expensesNum),
    profit: toMoney(profit),
    profitNum: profit,
    margin: revenueNum > 0
      ? Math.round(((profit) / revenueNum) * 10000) / 100
      : 0,
  };
}

// ─── Membership Analytics ──────────────────────────────────────

export async function membershipAnalytics(ctx: Ctx) {
  const { db, gymId } = ctx;
  const today = todayStr();
  const in7 = futureStr(7);
  const in30 = futureStr(30);

  const [memberStatusCounts, expiring7, expiring30, expiringList] = await Promise.all([
    // Count members (not membership records) by their current status
    db
      .select({ status: members.status, cnt: count() })
      .from(members)
      .where(eq(members.gymId, gymId))
      .groupBy(members.status),

    // Expiring queries stay on memberMemberships — these count active memberships ending soon
    db
      .select({ cnt: count() })
      .from(memberMemberships)
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          eq(memberMemberships.status, "active"),
          gte(memberMemberships.endDate, today),
          lte(memberMemberships.endDate, in7)
        )
      ),

    db
      .select({ cnt: count() })
      .from(memberMemberships)
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          eq(memberMemberships.status, "active"),
          gte(memberMemberships.endDate, today),
          lte(memberMemberships.endDate, in30)
        )
      ),

    db
      .select({
        membershipId: memberMemberships.id,
        memberId: members.id,
        memberName: members.name,
        memberPhone: members.phone,
        planName: membershipPlans.name,
        endDate: memberMemberships.endDate,
        daysLeft: sql<number>`(${memberMemberships.endDate}::date - CURRENT_DATE)`,
      })
      .from(memberMemberships)
      .innerJoin(members, eq(memberMemberships.memberId, members.id))
      .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          eq(memberMemberships.status, "active"),
          gte(memberMemberships.endDate, today),
          lte(memberMemberships.endDate, in30)
        )
      )
      .orderBy(memberMemberships.endDate),
  ]);

  const statusMap: Record<string, number> = {};
  for (const r of memberStatusCounts) statusMap[r.status] = r.cnt;

  return {
    active: statusMap["active"] ?? 0,
    frozen: statusMap["frozen"] ?? 0,
    expired: statusMap["expired"] ?? 0,
    cancelled: statusMap["cancelled"] ?? 0,
    expiring7Days: expiring7[0]!.cnt,
    expiring30Days: expiring30[0]!.cnt,
    expiringMemberships: expiringList,
  };
}

// ─── Outstanding Analytics ─────────────────────────────────────

export async function outstandingAnalytics(ctx: Ctx) {
  const { db, gymId } = ctx;

  const rows = await db
    .select({
      membershipId: memberMemberships.id,
      memberId: members.id,
      memberName: members.name,
      memberPhone: members.phone,
      planName: membershipPlans.name,
      totalAmount: memberMemberships.totalAmount,
      discountAmount: memberMemberships.discountAmount,
      paidAmount: memberMemberships.paidAmount,
      outstanding: sql<number>`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount})`,
      status: memberMemberships.status,
      endDate: memberMemberships.endDate,
    })
    .from(memberMemberships)
    .innerJoin(members, eq(memberMemberships.memberId, members.id))
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(memberMemberships.gymId, gymId),
        sql`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount}) > 0`
      )
    )
    .orderBy(desc(sql`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount})`));

  const totalOutstanding = rows.reduce((s, r) => s + Number(r.outstanding), 0);

  return {
    totalOutstanding: toMoney(totalOutstanding),
    membersWithDues: rows.length,
    balances: rows.map((r) => ({
      membershipId: r.membershipId,
      memberId: r.memberId,
      memberName: r.memberName,
      memberPhone: r.memberPhone,
      planName: r.planName,
      totalAmount: toMoney(r.totalAmount),
      discountAmount: toMoney(r.discountAmount),
      paidAmount: toMoney(r.paidAmount),
      outstanding: toMoney(r.outstanding),
      status: r.status,
      endDate: r.endDate,
    })),
  };
}

// ─── Trend Analytics (monthly, last 6 months) ──────────────────

export async function trendAnalytics(ctx: Ctx) {
  const { db, gymId } = ctx;

  const now = new Date();
  const months: { label: string; from: string; to: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    months.push({
      label: `${year}-${pad(month)}`,
      from: `${year}-${pad(month)}-01`,
      to: `${year}-${pad(month)}-${pad(lastDay)}`,
    });
  }

  const rangeFrom = months[0]!.from;
  const rangeTo = months[months.length - 1]!.to;
  const monthExpr = (col: typeof payments.paymentDate) =>
    sql<string>`TO_CHAR(${col}::date, 'YYYY-MM')`;

  const [revRows, expRows, newMemberRows, renewalRows] = await Promise.all([
    db
      .select({
        month: monthExpr(payments.paymentDate),
        total: sum(payments.amount),
        cnt: count(),
      })
      .from(payments)
      .where(and(eq(payments.gymId, gymId), gte(payments.paymentDate, rangeFrom), lte(payments.paymentDate, rangeTo)))
      .groupBy(monthExpr(payments.paymentDate))
      .orderBy(monthExpr(payments.paymentDate)),

    db
      .select({
        month: monthExpr(expenses.expenseDate),
        total: sum(expenses.amount),
        cnt: count(),
      })
      .from(expenses)
      .where(and(eq(expenses.gymId, gymId), gte(expenses.expenseDate, rangeFrom), lte(expenses.expenseDate, rangeTo)))
      .groupBy(monthExpr(expenses.expenseDate))
      .orderBy(monthExpr(expenses.expenseDate)),

    db
      .select({
        month: sql<string>`TO_CHAR(${members.joinDate}::date, 'YYYY-MM')`,
        cnt: count(),
      })
      .from(members)
      .where(and(eq(members.gymId, gymId), gte(members.joinDate, rangeFrom), lte(members.joinDate, rangeTo)))
      .groupBy(sql`TO_CHAR(${members.joinDate}::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${members.joinDate}::date, 'YYYY-MM')`),

    db
      .select({
        month: sql<string>`TO_CHAR(${memberMemberships.startDate}::date, 'YYYY-MM')`,
        cnt: count(),
      })
      .from(memberMemberships)
      .where(and(eq(memberMemberships.gymId, gymId), gte(memberMemberships.startDate, rangeFrom), lte(memberMemberships.startDate, rangeTo)))
      .groupBy(sql`TO_CHAR(${memberMemberships.startDate}::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${memberMemberships.startDate}::date, 'YYYY-MM')`),
  ]);

  const revMap = new Map(revRows.map((r) => [r.month, { total: Number(r.total ?? 0), cnt: r.cnt }]));
  const expMap = new Map(expRows.map((r) => [r.month, { total: Number(r.total ?? 0), cnt: r.cnt }]));
  const memMap = new Map(newMemberRows.map((r) => [r.month, r.cnt]));
  const renMap = new Map(renewalRows.map((r) => [r.month, r.cnt]));

  return months.map((m) => {
    const rev = revMap.get(m.label)?.total ?? 0;
    const exp = expMap.get(m.label)?.total ?? 0;
    return {
      month: m.label,
      revenue: toMoney(rev),
      expenses: toMoney(exp),
      profit: toMoney(rev - exp),
      paymentCount: revMap.get(m.label)?.cnt ?? 0,
      expenseCount: expMap.get(m.label)?.cnt ?? 0,
      newMembers: memMap.get(m.label) ?? 0,
      renewals: renMap.get(m.label) ?? 0,
    };
  });
}

// ─── Comparison helpers ────────────────────────────────────────

function pctChange(current: number, previous: number): { pct: number; dir: "up" | "down" | "flat" } {
  if (previous === 0 && current === 0) return { pct: 0, dir: "flat" };
  if (previous === 0) return { pct: 100, dir: "up" };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return {
    pct: Math.round(Math.abs(pct) * 10) / 10,
    dir: pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat",
  };
}

// ─── Unified Analytics (single call) ───────────────────────────

export async function getFullAnalytics(ctx: Ctx, filter: AnalyticsFilter) {
  const range = resolve(filter);
  const prevRange = previousDateRange(range);

  const [revenue, expense, prevRevenue, prevExpense, membership, outstanding, trends] = await Promise.all([
    revenueAnalytics(ctx, range),
    expenseAnalytics(ctx, range),
    revenueAnalytics(ctx, prevRange),
    expenseAnalytics(ctx, prevRange),
    membershipAnalytics(ctx),
    outstandingAnalytics(ctx),
    trendAnalytics(ctx),
  ]);

  const profit = profitAnalytics(revenue.totalRevenueNum, expense.totalExpensesNum);
  const prevProfit = profitAnalytics(prevRevenue.totalRevenueNum, prevExpense.totalExpensesNum);

  const revenueChange = pctChange(revenue.totalRevenueNum, prevRevenue.totalRevenueNum);
  const expenseChange = pctChange(expense.totalExpensesNum, prevExpense.totalExpensesNum);
  const profitChange = pctChange(profit.profitNum, prevProfit.profitNum);
  const marginChange = pctChange(profit.margin, prevProfit.margin);

  return {
    period: { from: range.from, to: range.to, range: filter.range },
    previousPeriod: { from: prevRange.from, to: prevRange.to },
    revenue: {
      totalRevenue: revenue.totalRevenue,
      paymentCount: revenue.paymentCount,
      averagePayment: revenue.averagePayment,
      paymentMethodBreakdown: revenue.paymentMethodBreakdown,
      change: revenueChange,
      previousTotal: prevRevenue.totalRevenue,
    },
    expenses: {
      totalExpenses: expense.totalExpenses,
      expenseCount: expense.expenseCount,
      categoryBreakdown: expense.categoryBreakdown,
      change: expenseChange,
      previousTotal: prevExpense.totalExpenses,
    },
    profit: {
      revenue: profit.revenue,
      expenses: profit.expenses,
      profit: profit.profit,
      margin: profit.margin,
      change: profitChange,
      previousProfit: prevProfit.profit,
      marginChange,
      previousMargin: prevProfit.margin,
    },
    memberships: {
      active: membership.active,
      frozen: membership.frozen,
      expired: membership.expired,
      cancelled: membership.cancelled,
      expiring7Days: membership.expiring7Days,
      expiring30Days: membership.expiring30Days,
      expiringMemberships: membership.expiringMemberships,
    },
    outstanding: {
      totalOutstanding: outstanding.totalOutstanding,
      membersWithDues: outstanding.membersWithDues,
      balances: outstanding.balances,
    },
    trends,
  };
}
