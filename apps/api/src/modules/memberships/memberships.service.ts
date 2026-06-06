import { eq, and, desc } from "drizzle-orm";
import {
  memberMemberships,
  membershipPlans,
  membershipFreezes,
  members,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type {
  CreateMembershipInput,
  RenewMembershipInput,
  FreezeMembershipInput,
  UnfreezeMembershipInput,
} from "@gymflow/shared";
import { addDays, daysBetween } from "@gymflow/shared";
import { AppError } from "../../utils/app-error.js";
import { createAuditLog } from "../../utils/audit.js";
import { toMoney } from "../../utils/money.js";

interface Ctx {
  db: Database;
  gymId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function computeEndDate(startDate: string, durationDays: number): string {
  const d = addDays(new Date(startDate), durationDays - 1);
  return d.toISOString().split("T")[0]!;
}

function outstanding(total: string, discount: string, paid: string): number {
  return Number(total) - Number(discount) - Number(paid);
}

async function assertMemberInGym(db: Database, memberId: string, gymId: string) {
  const [m] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.gymId, gymId)))
    .limit(1);
  if (!m) throw AppError.notFound("Member");
}

async function getMembershipOrFail(db: Database, membershipId: string, gymId: string) {
  const [ms] = await db
    .select()
    .from(memberMemberships)
    .where(and(eq(memberMemberships.id, membershipId), eq(memberMemberships.gymId, gymId)))
    .limit(1);
  if (!ms) throw AppError.notFound("Membership");
  return ms;
}

async function getActiveFreeze(db: Database, membershipId: string) {
  const [f] = await db
    .select()
    .from(membershipFreezes)
    .where(
      and(
        eq(membershipFreezes.membershipId, membershipId),
        eq(membershipFreezes.status, "active")
      )
    )
    .limit(1);
  return f ?? null;
}

// ─── Create Membership ─────────────────────────────────────────

export async function createMembership(
  ctx: Ctx,
  memberId: string,
  input: CreateMembershipInput
) {
  const { db, gymId, userId } = ctx;

  await assertMemberInGym(db, memberId, gymId);

  // Check no active/frozen membership exists
  const [active] = await db
    .select({ id: memberMemberships.id, status: memberMemberships.status })
    .from(memberMemberships)
    .where(
      and(
        eq(memberMemberships.memberId, memberId),
        eq(memberMemberships.gymId, gymId),
        eq(memberMemberships.status, "active")
      )
    )
    .limit(1);

  if (active) {
    throw AppError.conflict("Member already has an active membership. Renew or cancel it first.");
  }

  // Get plan
  const [plan] = await db
    .select()
    .from(membershipPlans)
    .where(
      and(
        eq(membershipPlans.id, input.planId),
        eq(membershipPlans.gymId, gymId),
        eq(membershipPlans.isActive, true)
      )
    )
    .limit(1);

  if (!plan) throw AppError.notFound("Membership plan");

  const endDate = computeEndDate(input.startDate, plan.durationDays);
  const totalAmount = plan.price;
  const discountStr = String(input.discountAmount);
  const net = Number(totalAmount) - input.discountAmount;

  if (net < 0) {
    throw AppError.badRequest("Discount cannot exceed plan price");
  }

  const [membership] = await db
    .insert(memberMemberships)
    .values({
      memberId,
      gymId,
      planId: input.planId,
      startDate: input.startDate,
      endDate,
      totalAmount,
      discountAmount: discountStr,
      paidAmount: "0",
      notes: input.notes,
      createdBy: userId,
    })
    .returning();

  // Set member status to active
  await db
    .update(members)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(members.id, memberId));

  await createAuditLog(db, {
    gymId,
    userId,
    action: "membership_created",
    entityType: "member_membership",
    entityId: membership!.id,
    newValues: {
      memberId,
      planName: plan.name,
      startDate: input.startDate,
      endDate,
      totalAmount,
      discountAmount: discountStr,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ...membership!, planName: plan.name, outstandingAmount: toMoney(net) };
}

// ─── Get Membership Detail ─────────────────────────────────────

export async function getMembershipById(ctx: Ctx, membershipId: string) {
  const { db, gymId } = ctx;

  const [row] = await db
    .select({
      id: memberMemberships.id,
      memberId: memberMemberships.memberId,
      gymId: memberMemberships.gymId,
      planId: memberMemberships.planId,
      planName: membershipPlans.name,
      planDuration: membershipPlans.durationDays,
      startDate: memberMemberships.startDate,
      endDate: memberMemberships.endDate,
      status: memberMemberships.status,
      totalAmount: memberMemberships.totalAmount,
      discountAmount: memberMemberships.discountAmount,
      paidAmount: memberMemberships.paidAmount,
      notes: memberMemberships.notes,
      createdAt: memberMemberships.createdAt,
      updatedAt: memberMemberships.updatedAt,
    })
    .from(memberMemberships)
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(and(eq(memberMemberships.id, membershipId), eq(memberMemberships.gymId, gymId)))
    .limit(1);

  if (!row) throw AppError.notFound("Membership");

  const freezes = await db
    .select()
    .from(membershipFreezes)
    .where(eq(membershipFreezes.membershipId, membershipId))
    .orderBy(desc(membershipFreezes.createdAt));

  return {
    ...row,
    outstandingAmount: toMoney(outstanding(row.totalAmount, row.discountAmount, row.paidAmount)),
    freezes,
  };
}

// ─── List Member's Memberships ──────────────────────────────────

export async function listMemberMemberships(ctx: Ctx, memberId: string) {
  const { db, gymId } = ctx;

  await assertMemberInGym(db, memberId, gymId);

  const rows = await db
    .select({
      id: memberMemberships.id,
      planName: membershipPlans.name,
      startDate: memberMemberships.startDate,
      endDate: memberMemberships.endDate,
      status: memberMemberships.status,
      totalAmount: memberMemberships.totalAmount,
      discountAmount: memberMemberships.discountAmount,
      paidAmount: memberMemberships.paidAmount,
      createdAt: memberMemberships.createdAt,
    })
    .from(memberMemberships)
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(memberMemberships.memberId, memberId),
        eq(memberMemberships.gymId, gymId)
      )
    )
    .orderBy(desc(memberMemberships.createdAt));

  return rows.map((r) => ({
    ...r,
    outstandingAmount: toMoney(outstanding(r.totalAmount, r.discountAmount, r.paidAmount)),
  }));
}

// ─── Renew Membership ──────────────────────────────────────────

export async function renewMembership(
  ctx: Ctx,
  membershipId: string,
  input: RenewMembershipInput
) {
  const { db, gymId, userId } = ctx;

  const current = await getMembershipOrFail(db, membershipId, gymId);

  if (current.status === "active" || current.status === "frozen") {
    // Mark current as expired before renewing
    await db
      .update(memberMemberships)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(memberMemberships.id, membershipId));
  }

  const [plan] = await db
    .select()
    .from(membershipPlans)
    .where(
      and(
        eq(membershipPlans.id, input.planId),
        eq(membershipPlans.gymId, gymId),
        eq(membershipPlans.isActive, true)
      )
    )
    .limit(1);

  if (!plan) throw AppError.notFound("Membership plan");

  const endDate = computeEndDate(input.startDate, plan.durationDays);
  const discountStr = String(input.discountAmount);

  const [newMembership] = await db
    .insert(memberMemberships)
    .values({
      memberId: current.memberId,
      gymId,
      planId: input.planId,
      startDate: input.startDate,
      endDate,
      totalAmount: plan.price,
      discountAmount: discountStr,
      paidAmount: "0",
      notes: input.notes,
      createdBy: userId,
    })
    .returning();

  await db
    .update(members)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(members.id, current.memberId));

  await createAuditLog(db, {
    gymId,
    userId,
    action: "membership_renewed",
    entityType: "member_membership",
    entityId: newMembership!.id,
    oldValues: {
      previousMembershipId: membershipId,
      previousStatus: current.status,
    },
    newValues: {
      planName: plan.name,
      startDate: input.startDate,
      endDate,
      totalAmount: plan.price,
      discountAmount: discountStr,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const net = Number(plan.price) - input.discountAmount;
  return { ...newMembership!, planName: plan.name, outstandingAmount: toMoney(net) };
}

// ─── Freeze Membership ─────────────────────────────────────────

export async function freezeMembership(
  ctx: Ctx,
  membershipId: string,
  input: FreezeMembershipInput
) {
  const { db, gymId, userId } = ctx;

  const ms = await getMembershipOrFail(db, membershipId, gymId);

  if (ms.status !== "active") {
    throw AppError.badRequest(`Cannot freeze a membership with status '${ms.status}'`);
  }

  const existingFreeze = await getActiveFreeze(db, membershipId);
  if (existingFreeze) {
    throw AppError.conflict("This membership already has an active freeze");
  }

  const [freeze] = await db
    .insert(membershipFreezes)
    .values({
      membershipId,
      gymId,
      freezeStart: input.freezeStart,
      freezeEnd: input.freezeEnd,
      reason: input.reason,
      createdBy: userId,
    })
    .returning();

  await db
    .update(memberMemberships)
    .set({ status: "frozen", updatedAt: new Date() })
    .where(eq(memberMemberships.id, membershipId));

  await db
    .update(members)
    .set({ status: "frozen", updatedAt: new Date() })
    .where(eq(members.id, ms.memberId));

  await createAuditLog(db, {
    gymId,
    userId,
    action: "membership_frozen",
    entityType: "member_membership",
    entityId: membershipId,
    oldValues: { status: "active" },
    newValues: {
      status: "frozen",
      freezeId: freeze!.id,
      freezeStart: input.freezeStart,
      freezeEnd: input.freezeEnd,
      reason: input.reason,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return freeze!;
}

// ─── Unfreeze Membership ────────────────────────────────────────

export async function unfreezeMembership(
  ctx: Ctx,
  membershipId: string,
  input: UnfreezeMembershipInput
) {
  const { db, gymId, userId } = ctx;

  const ms = await getMembershipOrFail(db, membershipId, gymId);

  if (ms.status !== "frozen") {
    throw AppError.badRequest("Membership is not frozen");
  }

  const activeFreeze = await getActiveFreeze(db, membershipId);
  if (!activeFreeze) {
    throw AppError.badRequest("No active freeze found for this membership");
  }

  // Calculate days to add
  const freezeStartDate = new Date(activeFreeze.freezeStart);
  const unfreezeDate = new Date(input.unfreezeDate);
  const daysToAdd = daysBetween(freezeStartDate, unfreezeDate);

  if (daysToAdd < 0) {
    throw AppError.badRequest("Unfreeze date cannot be before freeze start date");
  }

  // Complete the freeze
  await db
    .update(membershipFreezes)
    .set({
      freezeEnd: input.unfreezeDate,
      status: "completed",
      daysAdded: daysToAdd,
    })
    .where(eq(membershipFreezes.id, activeFreeze.id));

  // Extend membership end date
  const currentEnd = new Date(ms.endDate);
  const newEnd = addDays(currentEnd, daysToAdd);
  const newEndStr = newEnd.toISOString().split("T")[0]!;

  await db
    .update(memberMemberships)
    .set({ status: "active", endDate: newEndStr, updatedAt: new Date() })
    .where(eq(memberMemberships.id, membershipId));

  await db
    .update(members)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(members.id, ms.memberId));

  await createAuditLog(db, {
    gymId,
    userId,
    action: "membership_unfrozen",
    entityType: "member_membership",
    entityId: membershipId,
    oldValues: {
      status: "frozen",
      endDate: ms.endDate,
    },
    newValues: {
      status: "active",
      endDate: newEndStr,
      daysAdded: daysToAdd,
      freezeId: activeFreeze.id,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    membershipId,
    previousEndDate: ms.endDate,
    newEndDate: newEndStr,
    daysAdded: daysToAdd,
    freezeId: activeFreeze.id,
  };
}
