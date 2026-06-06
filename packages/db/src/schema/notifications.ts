import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { gyms } from "./gyms.js";
import { members } from "./members.js";
import {
  notificationTypeEnum,
  notificationChannelEnum,
  notificationStatusEnum,
} from "./enums.js";

export const notificationsLog = pgTable(
  "notifications_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    memberId: uuid("member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    type: notificationTypeEnum("type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    recipient: text("recipient").notNull(),
    content: text("content"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_gym_created_idx").on(table.gymId, table.createdAt),
    index("notifications_member_idx").on(table.memberId),
    index("notifications_gym_type_idx").on(table.gymId, table.type),
  ]
);
