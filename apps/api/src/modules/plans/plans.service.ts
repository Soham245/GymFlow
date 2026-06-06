import { eq, and, asc, sql } from "drizzle-orm";
import { membershipPlans } from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type {
  CreatePlanInput,
  UpdatePlanInput,
  TogglePlanStatusInput,
} from "@gymflow/shared";
import { AppError } from "../../utils/app-error.js";
import { createAuditLog, diffValues } from "../../utils/audit.js";

interface Ctx {
  db: Database;
  gymId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

export async function createPlan(ctx: Ctx, input: CreatePlanInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select({ id: membershipPlans.id })
    .from(membershipPlans)
    .where(and(eq(membershipPlans.gymId, gymId), eq(membershipPlans.name, input.name)))
    .limit(1);

  if (existing) {
    throw AppError.conflict(`A plan named '${input.name}' already exists`);
  }

  const [plan] = await db
    .insert(membershipPlans)
    .values({
      gymId,
      name: input.name,
      durationDays: input.durationDays,
      price: String(input.price),
      description: input.description,
      sortOrder: input.sortOrder,
    })
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "plan_created",
    entityType: "membership_plan",
    entityId: plan!.id,
    newValues: { name: plan!.name, durationDays: plan!.durationDays, price: plan!.price },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return plan!;
}

export async function listPlans(ctx: Ctx, includeInactive = false) {
  const { db, gymId } = ctx;

  const conditions = [eq(membershipPlans.gymId, gymId)];
  if (!includeInactive) {
    conditions.push(eq(membershipPlans.isActive, true));
  }

  return db
    .select()
    .from(membershipPlans)
    .where(and(...conditions))
    .orderBy(asc(membershipPlans.sortOrder), asc(membershipPlans.name));
}

export async function getPlanById(ctx: Ctx, planId: string) {
  const { db, gymId } = ctx;

  const [plan] = await db
    .select()
    .from(membershipPlans)
    .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.gymId, gymId)))
    .limit(1);

  if (!plan) throw AppError.notFound("Membership plan");
  return plan;
}

export async function updatePlan(ctx: Ctx, planId: string, input: UpdatePlanInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(membershipPlans)
    .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.gymId, gymId)))
    .limit(1);

  if (!existing) throw AppError.notFound("Membership plan");

  if (input.name && input.name !== existing.name) {
    const [dup] = await db
      .select({ id: membershipPlans.id })
      .from(membershipPlans)
      .where(
        and(
          eq(membershipPlans.gymId, gymId),
          eq(membershipPlans.name, input.name),
          sql`${membershipPlans.id} != ${planId}`
        )
      )
      .limit(1);
    if (dup) throw AppError.conflict(`A plan named '${input.name}' already exists`);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.durationDays !== undefined) updateData.durationDays = input.durationDays;
  if (input.price !== undefined) updateData.price = String(input.price);
  if (input.description !== undefined) updateData.description = input.description;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  const [updated] = await db
    .update(membershipPlans)
    .set(updateData)
    .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.gymId, gymId)))
    .returning();

  const { oldValues, newValues } = diffValues(
    existing as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>
  );

  if (Object.keys(newValues).length > 0) {
    await createAuditLog(db, {
      gymId,
      userId,
      action: "plan_updated",
      entityType: "membership_plan",
      entityId: planId,
      oldValues,
      newValues,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return updated!;
}

export async function togglePlanStatus(ctx: Ctx, planId: string, input: TogglePlanStatusInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(membershipPlans)
    .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.gymId, gymId)))
    .limit(1);

  if (!existing) throw AppError.notFound("Membership plan");

  if (existing.isActive === input.isActive) {
    throw AppError.badRequest(`Plan is already ${input.isActive ? "active" : "inactive"}`);
  }

  const [updated] = await db
    .update(membershipPlans)
    .set({ isActive: input.isActive, updatedAt: new Date() })
    .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.gymId, gymId)))
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "plan_updated",
    entityType: "membership_plan",
    entityId: planId,
    oldValues: { isActive: existing.isActive },
    newValues: { isActive: input.isActive },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return updated!;
}
