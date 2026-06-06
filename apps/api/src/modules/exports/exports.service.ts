import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  members,
  payments,
  expenses,
  expenseCategories,
  memberMemberships,
  membershipPlans,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type { ReportQuery } from "@gymflow/shared";
import { resolveDateRange } from "../../utils/date-range.js";

interface Ctx {
  db: Database;
  gymId: string;
}

// ─── Members Export ─────────────────────────────────────────────

export async function exportMembers(ctx: Ctx) {
  const { db, gymId } = ctx;
  return db
    .select({
      name: members.name,
      phone: members.phone,
      email: members.email,
      gender: members.gender,
      dateOfBirth: members.dateOfBirth,
      address: members.address,
      joinDate: members.joinDate,
      status: members.status,
      emergencyContactName: members.emergencyContactName,
      emergencyContactPhone: members.emergencyContactPhone,
    })
    .from(members)
    .where(eq(members.gymId, gymId))
    .orderBy(members.name);
}

// ─── Revenue Export ─────────────────────────────────────────────

export async function exportRevenue(ctx: Ctx, query: ReportQuery) {
  const { db, gymId } = ctx;
  const range = resolveDateRange(query.period, query.from, query.to);

  return db
    .select({
      receiptNumber: payments.receiptNumber,
      memberName: members.name,
      memberPhone: members.phone,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentStatus: payments.paymentStatus,
      paymentDate: payments.paymentDate,
      notes: payments.notes,
    })
    .from(payments)
    .innerJoin(members, eq(payments.memberId, members.id))
    .where(
      and(
        eq(payments.gymId, gymId),
        gte(payments.paymentDate, range.from),
        lte(payments.paymentDate, range.to)
      )
    )
    .orderBy(desc(payments.paymentDate));
}

// ─── Expenses Export ────────────────────────────────────────────

export async function exportExpenses(ctx: Ctx, query: ReportQuery) {
  const { db, gymId } = ctx;
  const range = resolveDateRange(query.period, query.from, query.to);

  return db
    .select({
      categoryName: expenseCategories.name,
      amount: expenses.amount,
      description: expenses.description,
      expenseDate: expenses.expenseDate,
      paymentMethod: expenses.paymentMethod,
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
    .orderBy(desc(expenses.expenseDate));
}

// ─── Outstanding Balances Export ────────────────────────────────

export async function exportOutstandingBalances(ctx: Ctx) {
  const { db, gymId } = ctx;

  return db
    .select({
      memberName: members.name,
      memberPhone: members.phone,
      planName: membershipPlans.name,
      totalAmount: memberMemberships.totalAmount,
      discountAmount: memberMemberships.discountAmount,
      paidAmount: memberMemberships.paidAmount,
      outstanding: sql<string>`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount})`,
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
    .orderBy(
      desc(
        sql`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount})`
      )
    );
}
