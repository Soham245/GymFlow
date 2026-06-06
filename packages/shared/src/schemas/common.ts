import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const phoneSchema = z
  .string()
  .min(10)
  .max(15)
  .regex(/^\+?[0-9]+$/, "Invalid phone number");

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export type Pagination = z.infer<typeof paginationSchema>;
