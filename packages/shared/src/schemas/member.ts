import { z } from "zod";
import { GENDERS, MEMBER_STATUSES } from "../constants/enums.js";
import { phoneSchema, dateStringSchema, paginationSchema } from "./common.js";

export const createMemberSchema = z.object({
  name: z.string().min(2).max(255),
  phone: phoneSchema,
  email: z.string().email().nullish(),
  gender: z.enum(GENDERS).optional(),
  dateOfBirth: dateStringSchema.optional(),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactPhone: phoneSchema.nullish(),
  joinDate: dateStringSchema,
  photoUrl: z.string().url().optional(),
});

export const updateMemberSchema = createMemberSchema.partial();

export const changeStatusSchema = z.object({
  status: z.enum(MEMBER_STATUSES),
  reason: z.string().max(500).optional(),
});

export const listMembersSchema = paginationSchema.extend({
  status: z.enum(MEMBER_STATUSES).optional(),
  search: z.string().max(100).optional(),
  joinDateFrom: dateStringSchema.optional(),
  joinDateTo: dateStringSchema.optional(),
  sortBy: z.enum(["name", "joinDate", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const memberFilterSchema = z.object({
  status: z.enum(MEMBER_STATUSES).optional(),
  search: z.string().max(100).optional(),
  joinDateFrom: dateStringSchema.optional(),
  joinDateTo: dateStringSchema.optional(),
});

export const createMemberNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type ListMembersQuery = z.infer<typeof listMembersSchema>;
export type MemberFilter = z.infer<typeof memberFilterSchema>;
export type CreateMemberNoteInput = z.infer<typeof createMemberNoteSchema>;
