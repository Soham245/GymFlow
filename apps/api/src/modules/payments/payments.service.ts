import {
  eq,
  and,
  gte,
  lte,
  ilike,
  desc,
  asc,
  count,
  sum,
  sql,
  inArray,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import {
  payments,
  members,
  memberMemberships,
  membershipPlans,
  gyms,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type { CreatePaymentInput, UpdatePaymentInput, ListPaymentsQuery } from "@gymflow/shared";
import { AppError } from "../../utils/app-error.js";
import { createAuditLog } from "../../utils/audit.js";
import { generateReceiptNumber } from "../../utils/receipt-number.js";

interface Ctx {
  db: Database;
  gymId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

// ─── Record Payment ─────────────────────────────────────────────

export async function recordPayment(ctx: Ctx, input: CreatePaymentInput) {
  const { db, gymId, userId } = ctx;

  // Verify member belongs to gym
  const [member] = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(and(eq(members.id, input.memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!member) throw AppError.notFound("Member");

  // If linked to a membership, verify it and check overpayment
  let planName: string | null = null;

  if (input.membershipId) {
    const [ms] = await db
      .select({
        id: memberMemberships.id,
        gymId: memberMemberships.gymId,
        status: memberMemberships.status,
        totalAmount: memberMemberships.totalAmount,
        discountAmount: memberMemberships.discountAmount,
        paidAmount: memberMemberships.paidAmount,
        planName: membershipPlans.name,
      })
      .from(memberMemberships)
      .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
      .where(
        and(
          eq(memberMemberships.id, input.membershipId),
          eq(memberMemberships.gymId, gymId)
        )
      )
      .limit(1);

    if (!ms) throw AppError.notFound("Membership");

    if (ms.status !== "active" && ms.status !== "frozen") {
      throw AppError.badRequest(
        `Cannot record payment for a membership with status '${ms.status}'`
      );
    }

    planName = ms.planName;

    const outstanding =
      Number(ms.totalAmount) - Number(ms.discountAmount) - Number(ms.paidAmount);

    if (input.amount > outstanding) {
      throw AppError.badRequest(
        `Payment amount (${input.amount}) exceeds outstanding balance (${outstanding.toFixed(2)})`
      );
    }
  }

  // Generate receipt number
  const receiptNumber = await generateReceiptNumber(db, gymId);

  // Determine payment status
  let paymentStatus: "paid" | "partial" = "paid";

  if (input.membershipId) {
    const [ms] = await db
      .select({
        totalAmount: memberMemberships.totalAmount,
        discountAmount: memberMemberships.discountAmount,
        paidAmount: memberMemberships.paidAmount,
      })
      .from(memberMemberships)
      .where(eq(memberMemberships.id, input.membershipId))
      .limit(1);

    const netDue = Number(ms!.totalAmount) - Number(ms!.discountAmount);
    const newPaid = Number(ms!.paidAmount) + input.amount;

    paymentStatus = newPaid >= netDue ? "paid" : "partial";
  }

  // Insert payment
  const [payment] = await db
    .insert(payments)
    .values({
      gymId,
      memberId: input.memberId,
      membershipId: input.membershipId,
      receiptNumber,
      amount: String(input.amount),
      paymentMethod: input.paymentMethod,
      paymentStatus,
      paymentDate: input.paymentDate,
      notes: input.notes,
      createdBy: userId,
    })
    .returning();

  // Update membership paid_amount
  if (input.membershipId) {
    await db
      .update(memberMemberships)
      .set({
        paidAmount: sql`${memberMemberships.paidAmount} + ${String(input.amount)}`,
        updatedAt: new Date(),
      })
      .where(eq(memberMemberships.id, input.membershipId));
  }

  // Audit log
  await createAuditLog(db, {
    gymId,
    userId,
    action: "payment_created",
    entityType: "payment",
    entityId: payment!.id,
    newValues: {
      receiptNumber,
      memberId: input.memberId,
      membershipId: input.membershipId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentStatus,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ...payment!,
    memberName: member.name,
    planName,
  };
}

// ─── Get Payment by ID ──────────────────────────────────────────

export async function getPaymentById(ctx: Ctx, paymentId: string) {
  const { db, gymId } = ctx;

  const [row] = await db
    .select({
      id: payments.id,
      gymId: payments.gymId,
      memberId: payments.memberId,
      memberName: members.name,
      memberPhone: members.phone,
      membershipId: payments.membershipId,
      planName: membershipPlans.name,
      receiptNumber: payments.receiptNumber,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentStatus: payments.paymentStatus,
      paymentDate: payments.paymentDate,
      notes: payments.notes,
      createdAt: payments.createdAt,
      gymName: gyms.name,
      gymAddress: gyms.address,
      gymPhone: gyms.phone,
    })
    .from(payments)
    .innerJoin(members, eq(payments.memberId, members.id))
    .innerJoin(gyms, eq(payments.gymId, gyms.id))
    .leftJoin(memberMemberships, eq(payments.membershipId, memberMemberships.id))
    .leftJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(and(eq(payments.id, paymentId), eq(payments.gymId, gymId)))
    .limit(1);

  if (!row) throw AppError.notFound("Payment");
  return row;
}

// ─── List Payments (paginated, filtered) ────────────────────────

export async function listPayments(ctx: Ctx, query: ListPaymentsQuery) {
  const { db, gymId } = ctx;
  const { page, limit, memberId, membershipId, paymentMethod, dateFrom, dateTo, receiptNumber, sortBy, sortOrder } = query;

  const conditions: SQL[] = [eq(payments.gymId, gymId)];

  if (memberId) conditions.push(eq(payments.memberId, memberId));
  if (membershipId) conditions.push(eq(payments.membershipId, membershipId));
  if (paymentMethod) conditions.push(eq(payments.paymentMethod, paymentMethod));
  if (dateFrom) conditions.push(gte(payments.paymentDate, dateFrom));
  if (dateTo) conditions.push(lte(payments.paymentDate, dateTo));
  if (receiptNumber) conditions.push(ilike(payments.receiptNumber, `%${receiptNumber}%`));

  const where = and(...conditions)!;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: payments.id,
        memberId: payments.memberId,
        memberName: members.name,
        membershipId: payments.membershipId,
        receiptNumber: payments.receiptNumber,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentStatus: payments.paymentStatus,
        paymentDate: payments.paymentDate,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(where)
      .orderBy((() => {
        const dir = sortOrder === "asc" ? asc : desc;
        switch (sortBy) {
          case "paymentDate": return dir(payments.paymentDate);
          case "amount": return dir(payments.amount);
          default: return dir(payments.createdAt);
        }
      })())
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(payments).where(where),
  ]);

  const total = totalResult[0]!.total;
  return {
    items: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
}

// ─── Payments for a membership ──────────────────────────────────

export async function listMembershipPayments(ctx: Ctx, membershipId: string) {
  const { db, gymId } = ctx;

  const [ms] = await db
    .select({ id: memberMemberships.id })
    .from(memberMemberships)
    .where(and(eq(memberMemberships.id, membershipId), eq(memberMemberships.gymId, gymId)))
    .limit(1);

  if (!ms) throw AppError.notFound("Membership");

  return db
    .select({
      id: payments.id,
      receiptNumber: payments.receiptNumber,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentStatus: payments.paymentStatus,
      paymentDate: payments.paymentDate,
      notes: payments.notes,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.membershipId, membershipId), eq(payments.gymId, gymId)))
    .orderBy(desc(payments.createdAt));
}

// ─── Payments for a member ──────────────────────────────────────

export async function listMemberPayments(ctx: Ctx, memberId: string) {
  const { db, gymId } = ctx;

  const [m] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);

  if (!m) throw AppError.notFound("Member");

  return db
    .select({
      id: payments.id,
      membershipId: payments.membershipId,
      receiptNumber: payments.receiptNumber,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentStatus: payments.paymentStatus,
      paymentDate: payments.paymentDate,
      notes: payments.notes,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.memberId, memberId), eq(payments.gymId, gymId)))
    .orderBy(desc(payments.createdAt));
}

// ─── Update Payment ────────────────────────────────────────────

export async function updatePayment(ctx: Ctx, paymentId: string, input: UpdatePaymentInput) {
  const { db, gymId, userId } = ctx;

  // Get existing payment
  const [existing] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.gymId, gymId)))
    .limit(1);

  if (!existing) throw AppError.notFound("Payment");

  const oldAmount = parseFloat(existing.amount);
  const newAmount = input.amount ?? oldAmount;

  // If amount changed and linked to a membership, adjust paidAmount
  if (input.amount !== undefined && input.amount !== oldAmount && existing.membershipId) {
    const diff = newAmount - oldAmount;
    await db
      .update(memberMemberships)
      .set({
        paidAmount: sql`GREATEST(${memberMemberships.paidAmount} + ${diff.toFixed(2)}::numeric, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(memberMemberships.id, existing.membershipId));
  }

  // Build update set
  const updateSet: Record<string, unknown> = { updatedAt: new Date() };
  if (input.amount !== undefined) updateSet.amount = String(input.amount);
  if (input.paymentMethod !== undefined) updateSet.paymentMethod = input.paymentMethod;
  if (input.paymentDate !== undefined) updateSet.paymentDate = input.paymentDate;
  if (input.notes !== undefined) updateSet.notes = input.notes;

  // Recalculate payment status if amount changed and membership linked
  if (input.amount !== undefined && existing.membershipId) {
    const [ms] = await db
      .select({
        totalAmount: memberMemberships.totalAmount,
        discountAmount: memberMemberships.discountAmount,
        paidAmount: memberMemberships.paidAmount,
      })
      .from(memberMemberships)
      .where(eq(memberMemberships.id, existing.membershipId))
      .limit(1);

    if (ms) {
      const netDue = Number(ms.totalAmount) - Number(ms.discountAmount);
      updateSet.paymentStatus = Number(ms.paidAmount) >= netDue ? "paid" : "partial";
    }
  }

  const [updated] = await db
    .update(payments)
    .set(updateSet)
    .where(eq(payments.id, paymentId))
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "payment_updated",
    entityType: "payment",
    entityId: paymentId,
    oldValues: {
      amount: existing.amount,
      paymentMethod: existing.paymentMethod,
      paymentDate: existing.paymentDate,
      notes: existing.notes,
    },
    newValues: input,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return updated;
}

// ─── Batch Delete Payments ──────────────────────────────────────

export async function batchDeletePayments(ctx: Ctx, paymentIds: string[]) {
  const { db, gymId, userId } = ctx;

  if (paymentIds.length === 0) return { deleted: 0 };
  if (paymentIds.length > 50) {
    throw AppError.badRequest("Cannot delete more than 50 payments at once");
  }

  // Verify all payments belong to this gym
  const existing = await db
    .select({
      id: payments.id,
      receiptNumber: payments.receiptNumber,
      amount: payments.amount,
      memberId: payments.memberId,
      membershipId: payments.membershipId,
    })
    .from(payments)
    .where(and(eq(payments.gymId, gymId), inArray(payments.id, paymentIds)));

  if (existing.length !== paymentIds.length) {
    throw AppError.badRequest(
      "Some payment IDs are invalid or don't belong to this gym"
    );
  }

  // Reverse paidAmount on linked memberships
  const membershipUpdates = new Map<string, number>();
  for (const p of existing) {
    if (p.membershipId) {
      const current = membershipUpdates.get(p.membershipId) ?? 0;
      membershipUpdates.set(p.membershipId, current + parseFloat(p.amount));
    }
  }
  for (const [msId, amount] of membershipUpdates) {
    await db
      .update(memberMemberships)
      .set({
        paidAmount: sql`GREATEST(${memberMemberships.paidAmount} - ${amount.toFixed(2)}::numeric, 0)`,
      })
      .where(eq(memberMemberships.id, msId));
  }

  await db.delete(payments).where(inArray(payments.id, paymentIds));

  for (const p of existing) {
    await createAuditLog(db, {
      gymId,
      userId,
      action: "payment_deleted",
      entityType: "payment",
      entityId: p.id,
      oldValues: { receiptNumber: p.receiptNumber, amount: p.amount },
      newValues: null,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return { deleted: existing.length };
}
