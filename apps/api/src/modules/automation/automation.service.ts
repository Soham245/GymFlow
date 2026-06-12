import { eq, and, gte, lte, count, sum, sql, desc } from "drizzle-orm";
import {
  members,
  memberMemberships,
  membershipPlans,
  payments,
  expenses,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import { toMoney } from "../../utils/money.js";

interface Ctx {
  db: Database;
  gymId: string;
}

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function futureStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Expiring Memberships (for renewal reminders) ───────────────

export async function getExpiringMemberships(ctx: Ctx) {
  const { db, gymId } = ctx;
  const today = todayStr();

  async function getExpiring(withinDays: number) {
    const futureDate = futureStr(withinDays);
    return db
      .select({
        membershipId: memberMemberships.id,
        memberId: members.id,
        memberName: members.name,
        memberPhone: members.phone,
        memberEmail: members.email,
        planName: membershipPlans.name,
        startDate: memberMemberships.startDate,
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
          lte(memberMemberships.endDate, futureDate)
        )
      )
      .orderBy(memberMemberships.endDate);
  }

  const [in7, in3, in1] = await Promise.all([
    getExpiring(7),
    getExpiring(3),
    getExpiring(1),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    expiring7Days: { count: in7.length, members: in7 },
    expiring3Days: { count: in3.length, members: in3 },
    expiring1Day: { count: in1.length, members: in1 },
  };
}

// ─── Expired Memberships (for follow-up) ────────────────────────

export async function getExpiredMemberships(ctx: Ctx) {
  const { db, gymId } = ctx;
  const today = todayStr();

  // Active memberships past their end date
  const expired = await db
    .select({
      membershipId: memberMemberships.id,
      memberId: members.id,
      memberName: members.name,
      memberPhone: members.phone,
      memberEmail: members.email,
      planName: membershipPlans.name,
      endDate: memberMemberships.endDate,
      daysPastExpiry: sql<number>`(CURRENT_DATE - ${memberMemberships.endDate}::date)`,
      outstandingAmount: sql<number>`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount})`,
    })
    .from(memberMemberships)
    .innerJoin(members, eq(memberMemberships.memberId, members.id))
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(memberMemberships.gymId, gymId),
        eq(memberMemberships.status, "active"),
        sql`${memberMemberships.endDate}::date < CURRENT_DATE`
      )
    )
    .orderBy(memberMemberships.endDate);

  return {
    generatedAt: new Date().toISOString(),
    count: expired.length,
    expiredMemberships: expired.map((r) => ({
      ...r,
      outstandingAmount: toMoney(r.outstandingAmount),
    })),
  };
}

// ─── Daily Business Summary ─────────────────────────────────────

export async function getDailySummary(ctx: Ctx, options?: { from?: string; to?: string }) {
  const { db, gymId } = ctx;
  const from = options?.from ?? todayStr();
  const to = options?.to ?? from;
  const isRange = from !== to;

  const [
    revResult,
    expResult,
    newMembersResult,
    renewalsResult,
  ] = await Promise.all([
    db
      .select({ total: sum(payments.amount), cnt: count() })
      .from(payments)
      .where(
        and(
          eq(payments.gymId, gymId),
          gte(payments.paymentDate, from),
          lte(payments.paymentDate, to)
        )
      ),

    db
      .select({ total: sum(expenses.amount), cnt: count() })
      .from(expenses)
      .where(
        and(
          eq(expenses.gymId, gymId),
          gte(expenses.expenseDate, from),
          lte(expenses.expenseDate, to)
        )
      ),

    db
      .select({ cnt: count() })
      .from(members)
      .where(
        and(
          eq(members.gymId, gymId),
          gte(members.joinDate, from),
          lte(members.joinDate, to)
        )
      ),

    // Renewals: memberships created in the date range for existing members (joinDate < from)
    db
      .select({ cnt: count() })
      .from(memberMemberships)
      .innerJoin(members, eq(memberMemberships.memberId, members.id))
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          sql`${memberMemberships.createdAt}::date >= ${from}::date`,
          sql`${memberMemberships.createdAt}::date <= ${to}::date`,
          sql`${members.joinDate}::date < ${from}::date`
        )
      ),
  ]);

  const revenue = Number(revResult[0]?.total ?? 0);
  const expenseTotal = Number(expResult[0]?.total ?? 0);

  return {
    generatedAt: new Date().toISOString(),
    from,
    to,
    isRange,
    revenue: {
      total: toMoney(revenue),
      paymentCount: revResult[0]?.cnt ?? 0,
    },
    expenses: {
      total: toMoney(expenseTotal),
      expenseCount: expResult[0]?.cnt ?? 0,
    },
    profit: toMoney(revenue - expenseTotal),
    newMembers: newMembersResult[0]?.cnt ?? 0,
    renewals: renewalsResult[0]?.cnt ?? 0,
  };
}

// ─── Backup Status (mock for V1) ────────────────────────────────

export async function getBackupStatus(ctx: Ctx) {
  return {
    generatedAt: new Date().toISOString(),
    lastBackup: {
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      sizeBytes: 2_458_624,
      sizeMB: "2.34",
      status: "completed",
      type: "pg_dump",
      destination: "neon-pitr",
    },
    neonBuiltIn: {
      pointInTimeRecovery: true,
      retentionDays: 7,
      status: "active",
    },
    nextScheduledBackup: new Date(
      Date.now() + 86400000 - (Date.now() % 86400000)
    ).toISOString(),
    note: "Neon provides built-in PITR. Custom pg_dump via n8n is a secondary safety net.",
  };
}
