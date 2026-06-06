import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { gyms } from "./gyms.js";
import { users } from "./users.js";
import { auditActionEnum } from "./enums.js";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_gym_created_idx").on(table.gymId, table.createdAt),
    index("audit_logs_gym_action_idx").on(table.gymId, table.action),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_user_idx").on(table.userId),
  ]
);
