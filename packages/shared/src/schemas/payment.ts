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

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;
