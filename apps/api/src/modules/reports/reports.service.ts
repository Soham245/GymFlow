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
import type { ReportQuery } from "@gymflow/shared";
import { resolveDateRange, type DateRange } from "../../utils/date-range.js";

interface Ctx {
  db: Database;
  gymId: string;
}

function resolve(query: ReportQuery): DateRange {
  return resolveDateRange(query.period, query.from, query.to);
}

// ─── Revenue Report ─────────────────────────────────────────────

export async function revenueReport(ctx: Ctx, query: ReportQuery) {
  const { db, gymId } = ctx;
  const range = resolve(query);

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
    period: { from: range.from, to: range.to },
    totalRevenue: toMoney(totalRevenue),
    paymentCount,
    averagePayment: toMoney(paymentCount > 0 ? totalRevenue / paymentCount : 0),
    paymentMethodBreakdown: methodBreakdown.map((m) => ({
      method: m.method,
      total: toMoney(m.total),
      count: m.cnt,
    })),
  };
}

// ─── Expense Report ─────────────────────────────────────────────

export async function expenseReport(ctx: Ctx, query: ReportQuery) {
  const { db, gymId } = ctx;
  const range = resolve(query);

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

  return {
    period: { from: range.from, to: range.to },
    totalExpenses: toMoney(totals[0]?.totalExpenses),
    expenseCount: totals[0]?.expenseCount ?? 0,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.categoryName,
      total: toMoney(c.total),
      count: c.cnt,
    })),
  };
}

// ─── Profit Report ──────────────────────────────────────────────

export async function profitReport(ctx: Ctx, query: ReportQuery) {
  const { db, gymId } = ctx;
  const range = resolve(query);

  const [revResult, expResult] = await Promise.all([
    db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.gymId, gymId),
          gte(payments.paymentDate, range.from),
          lte(payments.paymentDate, range.to)
        )
      ),
    db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.gymId, gymId),
          gte(expenses.expenseDate, range.from),
          lte(expenses.expenseDate, range.to)
        )
      ),
  ]);

  const revenue = Number(revResult[0]?.total ?? 0);
  const expenseTotal = Number(expResult[0]?.total ?? 0);

  return {
    period: { from: range.from, to: range.to },
    revenue: toMoney(revenue),
    expenses: toMoney(expenseTotal),
    profit: toMoney(revenue - expenseTotal),
    margin: revenue > 0 ? Math.round(((revenue - expenseTotal) / revenue) * 10000) / 100 : 0,
  };
}

// ─── Membership Report ──────────────────────────────────────────

export async function membershipReport(ctx: Ctx) {
  const { db, gymId } = ctx;
  const today = new Date().toISOString().split("T")[0]!;

  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().split("T")[0]!;

  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().split("T")[0]!;

  const [statusCounts, expiring7, expiring30, expiringList] = await Promise.all([
    db
      .select({ status: memberMemberships.status, cnt: count() })
      .from(memberMemberships)
      .where(eq(memberMemberships.gymId, gymId))
      .groupBy(memberMemberships.status),

    db
      .select({ cnt: count() })
      .from(memberMemberships)
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          eq(memberMemberships.status, "active"),
          gte(memberMemberships.endDate, today),
          lte(memberMemberships.endDate, in7Str)
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
          lte(memberMemberships.endDate, in30Str)
        )
      ),

    // List of expiring memberships (next 30 days)
    db
      .select({
        membershipId: memberMemberships.id,
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
          lte(memberMemberships.endDate, in30Str)
        )
      )
      .orderBy(memberMemberships.endDate),
  ]);

  const statusMap: Record<string, number> = {};
  for (const r of statusCounts) statusMap[r.status] = r.cnt;

  return {
    summary: {
      active: statusMap["active"] ?? 0,
      frozen: statusMap["frozen"] ?? 0,
      expired: statusMap["expired"] ?? 0,
      cancelled: statusMap["cancelled"] ?? 0,
    },
    expiring7Days: expiring7[0]!.cnt,
    expiring30Days: expiring30[0]!.cnt,
    expiringMemberships: expiringList,
  };
}

// ─── Outstanding Balances ───────────────────────────────────────

export async function outstandingBalances(ctx: Ctx) {
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
    count: rows.length,
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
