import { z } from "zod";
import { MESSAGE_TRIGGER_TYPES, NOTIFICATION_CHANNELS, SCHEDULED_MESSAGE_STATUSES } from "../constants/enums.js";
import { uuidSchema, paginationSchema, dateStringSchema } from "./common.js";

// ─── Message Templates ─────────────────────────────────────────

export const createMessageTemplateSchema = z.object({
  name: z.string().min(2).max(255),
  content: z.string().min(1).max(2000),
  triggerType: z.enum(MESSAGE_TRIGGER_TYPES).nullable().default(null),
  channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).max(3).default(["whatsapp"]),
});

export const updateMessageTemplateSchema = createMessageTemplateSchema.partial();

export const toggleTemplateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const previewTemplateSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ─── Scheduled Messages ────────────────────────────────────────

export const createScheduledMessageSchema = z.object({
  templateId: uuidSchema,
  name: z.string().min(2).max(255),
  scheduledAt: z.string().datetime(),
  targetFilter: z
    .object({
      status: z.string().optional(),
      gender: z.string().optional(),
    })
    .nullable()
    .default(null),
});

export const updateScheduledMessageSchema = z.object({
  templateId: uuidSchema.optional(),
  name: z.string().min(2).max(255).optional(),
  scheduledAt: z.string().datetime().optional(),
  targetFilter: z
    .object({
      status: z.string().optional(),
      gender: z.string().optional(),
    })
    .nullable()
    .optional(),
});

// ─── Message Log Filters ───────────────────────────────────────

export const listMessageLogSchema = paginationSchema.extend({
  memberId: uuidSchema.optional(),
  templateId: uuidSchema.optional(),
  triggerType: z.enum(MESSAGE_TRIGGER_TYPES).optional(),
  status: z.enum(["pending", "sent", "failed"] as const).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
});

// ─── Send Message (internal, used by n8n integration) ──────────

export const sendMessageSchema = z.object({
  templateId: uuidSchema,
  memberId: uuidSchema,
  variables: z.record(z.string()).optional(),
});

export const updateMessageStatusSchema = z.object({
  status: z.enum(["sent", "failed"] as const),
  errorMessage: z.string().max(500).optional(),
});

// ─── Types ─────────────────────────────────────────────────────

export type CreateMessageTemplateInput = z.infer<typeof createMessageTemplateSchema>;
export type UpdateMessageTemplateInput = z.infer<typeof updateMessageTemplateSchema>;
export type ToggleTemplateStatusInput = z.infer<typeof toggleTemplateStatusSchema>;
export type PreviewTemplateInput = z.infer<typeof previewTemplateSchema>;
export type CreateScheduledMessageInput = z.infer<typeof createScheduledMessageSchema>;
export type UpdateScheduledMessageInput = z.infer<typeof updateScheduledMessageSchema>;
export type ListMessageLogQuery = z.infer<typeof listMessageLogSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageStatusInput = z.infer<typeof updateMessageStatusSchema>;
