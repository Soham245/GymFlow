import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { gyms } from "./gyms.js";
import { members } from "./members.js";
import { users } from "./users.js";
import { notificationChannelEnum, notificationStatusEnum } from "./enums.js";

// ─── New Enums ─────────────────────────────────────────────────

export const messageTriggerTypeEnum = pgEnum("message_trigger_type", [
  "member_created",
  "membership_expiring_7_days",
  "membership_expiring_3_days",
  "membership_expiring_1_day",
  "membership_expired",
  "payment_received",
  "manual",
]);

export const scheduledMessageStatusEnum = pgEnum("scheduled_message_status", [
  "draft",
  "scheduled",
  "sent",
  "cancelled",
]);

// ─── Message Templates ─────────────────────────────────────────
//
// Owner-managed templates with optional auto-trigger binding.
// Content uses {{variable}} placeholders resolved at send time.
//
// If trigger_type is set → template fires automatically for that event.
// If trigger_type is NULL → template is manual/scheduled-only.
// Only ONE active template per (gym, trigger_type) pair is enforced
// at the application level (not DB constraint, since NULL triggers
// would conflict on the unique index).
//
// channels is a JSONB array of notification_channel values, e.g.
// ["whatsapp", "sms"]. This allows a single template to send via
// multiple channels simultaneously. Validated by Zod at app layer.

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    content: text("content").notNull(),
    triggerType: messageTriggerTypeEnum("trigger_type"),
    channels: jsonb("channels").notNull().$type<string[]>().default(["whatsapp"]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("message_templates_gym_name_uniq").on(table.gymId, table.name),
    index("message_templates_gym_active_idx").on(table.gymId, table.isActive),
    index("message_templates_gym_trigger_idx").on(
      table.gymId,
      table.triggerType
    ),
  ]
);

// ─── Scheduled Messages ────────────────────────────────────────
//
// One-off or recurring campaigns (Diwali greetings, promos, etc.).
// Each references a template for content.
// target_filter JSONB allows filtering recipients:
//   { "status": "active" }             → only active members
//   { "status": "active", "gender": "female" }  → targeted
//   null or {}                         → all members
//
// n8n polls for status='scheduled' WHERE scheduled_at <= NOW().

export const scheduledMessages = pgTable(
  "scheduled_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => messageTemplates.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    targetFilter: jsonb("target_filter"),
    status: scheduledMessageStatusEnum("status").notNull().default("draft"),
    sentCount: integer("sent_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("scheduled_messages_gym_status_idx").on(table.gymId, table.status),
    index("scheduled_messages_scheduled_at_idx").on(table.scheduledAt),
  ]
);

// ─── Notifications Log (extended) ──────────────────────────────
//
// The original notifications_log table stays unchanged in schema.
// We add a NEW table for the messaging-aware log that tracks
// template_id, trigger_type, and scheduled_message_id.
//
// DESIGN DECISION: Rather than ALTER the existing notifications_log
// (which would require a complex migration and break the existing
// automation module), we create a separate message_log table.
// The original notifications_log can be deprecated later.

export const messageLog = pgTable(
  "message_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    memberId: uuid("member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    templateId: uuid("template_id").references(() => messageTemplates.id, {
      onDelete: "set null",
    }),
    scheduledMessageId: uuid("scheduled_message_id").references(
      () => scheduledMessages.id,
      { onDelete: "set null" }
    ),
    triggerType: messageTriggerTypeEnum("trigger_type"),
    channel: notificationChannelEnum("channel").notNull(),
    recipient: text("recipient").notNull(),
    content: text("content"),
    status: notificationStatusEnum("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("message_log_gym_created_idx").on(table.gymId, table.createdAt),
    index("message_log_member_idx").on(table.memberId),
    index("message_log_template_idx").on(table.templateId),
    index("message_log_trigger_idx").on(table.gymId, table.triggerType),
    index("message_log_scheduled_idx").on(table.scheduledMessageId),
    index("message_log_gym_status_idx").on(table.gymId, table.status),
  ]
);
