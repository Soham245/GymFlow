import { z } from "zod";
import { PAYMENT_METHODS } from "../constants/enums.js";
import { dateStringSchema, uuidSchema, paginationSchema } from "./common.js";

// ─── Categories ─────────────────────────────────────────────────
export const createExpenseCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export const toggleCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

// ─── Expenses ───────────────────────────────────────────────────
export const createExpenseSchema = z.object({
  categoryId: uuidSchema,
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  expenseDate: dateStringSchema,
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  receiptUrl: z.string().url().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesSchema = paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["expenseDate", "amount", "createdAt"]).default("expenseDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Types ──────────────────────────────────────────────────────
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type ToggleCategoryStatusInput = z.infer<typeof toggleCategoryStatusSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesSchema>;
