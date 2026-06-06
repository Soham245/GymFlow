import { eq, and, asc, sql } from "drizzle-orm";
import { expenseCategories } from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  ToggleCategoryStatusInput,
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

export async function createCategory(ctx: Ctx, input: CreateExpenseCategoryInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(and(eq(expenseCategories.gymId, gymId), eq(expenseCategories.name, input.name)))
    .limit(1);

  if (existing) throw AppError.conflict(`Category '${input.name}' already exists`);

  const [cat] = await db
    .insert(expenseCategories)
    .values({ gymId, name: input.name, description: input.description })
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "expense_created",
    entityType: "expense_category",
    entityId: cat!.id,
    newValues: { name: cat!.name },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return cat!;
}

export async function listCategories(ctx: Ctx, includeInactive = false) {
  const { db, gymId } = ctx;
  const conditions = [eq(expenseCategories.gymId, gymId)];
  if (!includeInactive) conditions.push(eq(expenseCategories.isActive, true));

  return db
    .select()
    .from(expenseCategories)
    .where(and(...conditions))
    .orderBy(asc(expenseCategories.name));
}

export async function getCategoryById(ctx: Ctx, id: string) {
  const { db, gymId } = ctx;
  const [cat] = await db
    .select()
    .from(expenseCategories)
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.gymId, gymId)))
    .limit(1);
  if (!cat) throw AppError.notFound("Expense category");
  return cat;
}

export async function updateCategory(ctx: Ctx, id: string, input: UpdateExpenseCategoryInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(expenseCategories)
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.gymId, gymId)))
    .limit(1);

  if (!existing) throw AppError.notFound("Expense category");

  if (input.name && input.name !== existing.name) {
    const [dup] = await db
      .select({ id: expenseCategories.id })
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.gymId, gymId),
          eq(expenseCategories.name, input.name),
          sql`${expenseCategories.id} != ${id}`
        )
      )
      .limit(1);
    if (dup) throw AppError.conflict(`Category '${input.name}' already exists`);
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;

  const [updated] = await db
    .update(expenseCategories)
    .set(updateData)
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.gymId, gymId)))
    .returning();

  const { oldValues, newValues } = diffValues(
    existing as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>
  );

  if (Object.keys(newValues).length > 0) {
    await createAuditLog(db, {
      gymId,
      userId,
      action: "expense_updated",
      entityType: "expense_category",
      entityId: id,
      oldValues,
      newValues,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return updated!;
}

export async function toggleCategoryStatus(ctx: Ctx, id: string, input: ToggleCategoryStatusInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(expenseCategories)
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.gymId, gymId)))
    .limit(1);

  if (!existing) throw AppError.notFound("Expense category");
  if (existing.isActive === input.isActive) {
    throw AppError.badRequest(`Category is already ${input.isActive ? "active" : "inactive"}`);
  }

  const [updated] = await db
    .update(expenseCategories)
    .set({ isActive: input.isActive })
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.gymId, gymId)))
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "expense_updated",
    entityType: "expense_category",
    entityId: id,
    oldValues: { isActive: existing.isActive },
    newValues: { isActive: input.isActive },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return updated!;
}
