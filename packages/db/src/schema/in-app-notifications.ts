import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { gyms } from "./gyms.js";
import { inAppNotificationTypeEnum } from "./enums.js";

export const inAppNotifications = pgTable(
  "in_app_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    type: inAppNotificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedEntityType: varchar("related_entity_type", { length: 50 }),
    relatedEntityId: uuid("related_entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("in_app_notif_gym_created_idx").on(table.gymId, table.createdAt),
    index("in_app_notif_gym_unread_idx").on(table.gymId, table.isRead),
    index("in_app_notif_gym_type_idx").on(table.gymId, table.type),
    index("in_app_notif_entity_idx").on(table.relatedEntityType, table.relatedEntityId),
    uniqueIndex("in_app_notif_gym_type_entity_uniq")
      .on(table.gymId, table.type, table.relatedEntityType, table.relatedEntityId),
  ]
);
