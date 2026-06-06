import { z } from "zod";
import { dateStringSchema, uuidSchema } from "./common.js";

// ─── Plans ──────────────────────────────────────────────────────
export const createPlanSchema = z.object({
  name: z.string().min(2).max(255),
  durationDays: z.number().int().positive(),
  price: z.number().nonnegative(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export const togglePlanStatusSchema = z.object({
  isActive: z.boolean(),
});

// ─── Memberships ────────────────────────────────────────────────
export const createMembershipSchema = z.object({
  planId: uuidSchema,
  startDate: dateStringSchema,
  discountAmount: z.number().nonnegative().default(0),
  notes: z.string().max(500).optional(),
});

export const renewMembershipSchema = z.object({
  planId: uuidSchema,
  startDate: dateStringSchema,
  discountAmount: z.number().nonnegative().default(0),
  notes: z.string().max(500).optional(),
});

export const freezeMembershipSchema = z.object({
  freezeStart: dateStringSchema,
  freezeEnd: dateStringSchema.optional(),
  reason: z.string().max(500).optional(),
});

export const unfreezeMembershipSchema = z.object({
  unfreezeDate: dateStringSchema,
});

// ─── Types ──────────────────────────────────────────────────────
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type TogglePlanStatusInput = z.infer<typeof togglePlanStatusSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
export type FreezeMembershipInput = z.infer<typeof freezeMembershipSchema>;
export type UnfreezeMembershipInput = z.infer<typeof unfreezeMembershipSchema>;
