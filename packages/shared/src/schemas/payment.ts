import { z } from "zod";
import { PAYMENT_METHODS } from "../constants/enums.js";
import { dateStringSchema, uuidSchema, paginationSchema } from "./common.js";

export const createPaymentSchema = z.object({
  memberId: uuidSchema,
  membershipId: uuidSchema.optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paymentDate: dateStringSchema,
  notes: z.string().max(500).optional(),
});

export const listPaymentsSchema = paginationSchema.extend({
  memberId: uuidSchema.optional(),
  membershipId: uuidSchema.optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  receiptNumber: z.string().max(50).optional(),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  paymentDate: dateStringSchema.optional(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;
