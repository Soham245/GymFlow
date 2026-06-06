import { eq, and, gte, lte, count, sum, desc, sql } from "drizzle-orm";
import {
  members,
  memberMemberships,
  payments,
  expenses,
  expenseCategories,
  membershipPlans,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import { toMoney } from "../../utils/money.js";

interface Ctx {
  db: Database;
  gymId: string;
}

export async function getDashboard(ctx: Ctx) {
  const { db, gymId } = ctx;
  const now = new Date();
  const today = now.toISOString().split("T")[0]!;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]!;
  const yearStart = new Date(now.getFullYear(), 0, 1)
    .toISOString()
    .split("T")[0]!;

  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().split("T")[0]!;

  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().split("T")[0]!;

  const gymFilter = eq(members.gymId, gymId);

  // All queries in parallel
  const [
    memberCounts,
    expiring7,
    expiring30,
    todayRev,
    monthRev,
    yearRev,
    todayExp,
    monthExp,
    yearExp,
    outstandingResult,
    recentPaymentRows,
    recentExpenseRows,
  ] = await Promise.all([
    // Member counts by status
    db
      .select({
        status: members.status,
        cnt: count(),
      })
      .from(members)
      .where(gymFilter)
      .groupBy(members.status),

    // Expiring in 7 days
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

    // Expiring in 30 days
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

    // Today's revenue
    db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(eq(payments.gymId, gymId), eq(payments.paymentDate, today))
      ),

    // Month revenue
    db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.gymId, gymId),
          gte(payments.paymentDate, monthStart),
          lte(payments.paymentDate, today)
        )
      ),

    // Year revenue
    db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.gymId, gymId),
          gte(payments.paymentDate, yearStart),
          lte(payments.paymentDate, today)
        )
      ),

    // Today's expenses
    db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(eq(expenses.gymId, gymId), eq(expenses.expenseDate, today))
      ),

    // Month expenses
    db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.gymId, gymId),
          gte(expenses.expenseDate, monthStart),
          lte(expenses.expenseDate, today)
        )
      ),

    // Year expenses
    db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.gymId, gymId),
          gte(expenses.expenseDate, yearStart),
          lte(expenses.expenseDate, today)
        )
      ),

    // Outstanding balance
    db
      .select({
        total: sql<string>`COALESCE(SUM(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount}), 0)`,
      })
      .from(memberMemberships)
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          sql`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount}) > 0`
        )
      ),

    // Recent 5 payments
    db
      .select({
        id: payments.id,
        memberName: members.name,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        receiptNumber: payments.receiptNumber,
      })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(eq(payments.gymId, gymId))
      .orderBy(desc(payments.createdAt))
      .limit(5),

    // Recent 5 expenses
    db
      .select({
        id: expenses.id,
        categoryName: expenseCategories.name,
        amount: expenses.amount,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
      })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(eq(expenses.gymId, gymId))
      .orderBy(desc(expenses.expenseDate))
      .limit(5),
  ]);

  // Aggregate member counts
  const statusMap: Record<string, number> = {};
  let totalMembers = 0;
  for (const row of memberCounts) {
    statusMap[row.status] = row.cnt;
    totalMembers += row.cnt;
  }

  const n = (v: string | null) => Number(v ?? 0);

  const todayRevNum = n(todayRev[0]?.total ?? null);
  const monthRevNum = n(monthRev[0]?.total ?? null);
  const yearRevNum = n(yearRev[0]?.total ?? null);
  const todayExpNum = n(todayExp[0]?.total ?? null);
  const monthExpNum = n(monthExp[0]?.total ?? null);
  const yearExpNum = n(yearExp[0]?.total ?? null);

  return {
    members: {
      total: totalMembers,
      active: statusMap["active"] ?? 0,
      frozen: statusMap["frozen"] ?? 0,
      expired: statusMap["expired"] ?? 0,
      inactive: statusMap["inactive"] ?? 0,
    },
    memberships: {
      expiring7Days: expiring7[0]!.cnt,
      expiring30Days: expiring30[0]!.cnt,
    },
    revenue: {
      today: toMoney(todayRevNum),
      month: toMoney(monthRevNum),
      year: toMoney(yearRevNum),
    },
    expenses: {
      today: toMoney(todayExpNum),
      month: toMoney(monthExpNum),
      year: toMoney(yearExpNum),
    },
    profit: {
      today: toMoney(todayRevNum - todayExpNum),
      month: toMoney(monthRevNum - monthExpNum),
      year: toMoney(yearRevNum - yearExpNum),
    },
    outstandingBalance: toMoney(outstandingResult[0]?.total ?? 0),
    recentPayments: recentPaymentRows,
    recentExpenses: recentExpenseRows,
  };
}
