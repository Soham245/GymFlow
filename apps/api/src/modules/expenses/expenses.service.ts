import {
  eq,
  and,
  gte,
  lte,
  ilike,
  asc,
  desc,
  count,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { expenses, expenseCategories, users } from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
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

const MAX_FUTURE_DAYS = 30;

function assertDateNotTooFar(dateStr: string) {
  const d = new Date(dateStr);
  const limit = new Date();
  limit.setDate(limit.getDate() + MAX_FUTURE_DAYS);
  if (d > limit) {
    throw AppError.badRequest(`Expense date cannot be more than ${MAX_FUTURE_DAYS} days in the future`);
  }
}

async function assertCategoryInGym(db: Database, categoryId: string, gymId: string) {
  const [cat] = await db
    .select({ id: expenseCategories.id, isActive: expenseCategories.isActive })
    .from(expenseCategories)
    .where(and(eq(expenseCategories.id, categoryId), eq(expenseCategories.gymId, gymId)))
    .limit(1);
  if (!cat) throw AppError.notFound("Expense category");
  if (!cat.isActive) throw AppError.badRequest("Cannot use an inactive category");
  return cat;
}

const sortColumns = {
  expenseDate: expenses.expenseDate,
  amount: expenses.amount,
  createdAt: expenses.createdAt,
} as const;

// ─── Create ─────────────────────────────────────────────────────

export async function createExpense(ctx: Ctx, input: CreateExpenseInput) {
  const { db, gymId, userId } = ctx;

  assertDateNotTooFar(input.expenseDate);
  await assertCategoryInGym(db, input.categoryId, gymId);

  const [expense] = await db
    .insert(expenses)
    .values({
      gymId,
      categoryId: input.categoryId,
      amount: String(input.amount),
      description: input.description,
      expenseDate: input.expenseDate,
      paymentMethod: input.paymentMethod,
      receiptUrl: input.receiptUrl,
      createdBy: userId,
    })
    .returning();

  await createAuditLog(db, {
    gymId,
    userId,
    action: "expense_created",
    entityType: "expense",
    entityId: expense!.id,
    newValues: {
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description,
      expenseDate: input.expenseDate,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return expense!;
}

// ─── Get By ID ──────────────────────────────────────────────────

export async function getExpenseById(ctx: Ctx, expenseId: string) {
  const { db, gymId } = ctx;

  const [row] = await db
    .select({
      id: expenses.id,
      gymId: expenses.gymId,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      amount: expenses.amount,
      description: expenses.description,
      expenseDate: expenses.expenseDate,
      paymentMethod: expenses.paymentMethod,
      receiptUrl: expenses.receiptUrl,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      createdByName: users.name,
    })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(users, eq(expenses.createdBy, users.id))
    .where(and(eq(expenses.id, expenseId), eq(expenses.gymId, gymId)))
    .limit(1);

  if (!row) throw AppError.notFound("Expense");
  return row;
}

// ─── Update ─────────────────────────────────────────────────────

export async function updateExpense(ctx: Ctx, expenseId: string, input: UpdateExpenseInput) {
  const { db, gymId, userId } = ctx;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.gymId, gymId)))
    .limit(1);

  if (!existing) throw AppError.notFound("Expense");

  if (input.expenseDate) assertDateNotTooFar(input.expenseDate);
  if (input.categoryId) await assertCategoryInGym(db, input.categoryId, gymId);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.amount !== undefined) updateData.amount = String(input.amount);
  if (input.description !== undefined) updateData.description = input.description;
  if (input.expenseDate !== undefined) updateData.expenseDate = input.expenseDate;
  if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
  if (input.receiptUrl !== undefined) updateData.receiptUrl = input.receiptUrl;

  const [updated] = await db
    .update(expenses)
    .set(updateData)
    .where(and(eq(expenses.id, expenseId), eq(expenses.gymId, gymId)))
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
      entityType: "expense",
      entityId: expenseId,
      oldValues,
      newValues,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  return updated!;
}

// ─── List ───────────────────────────────────────────────────────

export async function listExpenses(ctx: Ctx, query: ListExpensesQuery) {
  const { db, gymId } = ctx;
  const { page, limit, categoryId, dateFrom, dateTo, search, sortBy, sortOrder } = query;

  const conditions: SQL[] = [eq(expenses.gymId, gymId)];

  if (categoryId) conditions.push(eq(expenses.categoryId, categoryId));
  if (dateFrom) conditions.push(gte(expenses.expenseDate, dateFrom));
  if (dateTo) conditions.push(lte(expenses.expenseDate, dateTo));
  if (search) conditions.push(ilike(expenses.description, `%${search}%`));

  const where = and(...conditions)!;
  const offset = (page - 1) * limit;
  const sortCol = sortColumns[sortBy];
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: expenses.id,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        amount: expenses.amount,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        paymentMethod: expenses.paymentMethod,
        receiptUrl: expenses.receiptUrl,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(expenses).where(where),
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
