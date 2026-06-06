import {
  pgTable,
  uuid,
  varchar,
  numeric,
  text,
  date,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { gyms } from "./gyms.js";
import { users } from "./users.js";
import { members } from "./members.js";
import { memberMemberships } from "./memberships.js";
import { paymentMethodEnum, paymentStatusEnum } from "./enums.js";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").references(
      () => memberMemberships.id,
      { onDelete: "set null" }
    ),
    receiptNumber: varchar("receipt_number", { length: 50 }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("paid"),
    paymentDate: date("payment_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("payments_gym_receipt_uniq").on(table.gymId, table.receiptNumber),
    index("payments_gym_date_idx").on(table.gymId, table.paymentDate),
    index("payments_gym_method_idx").on(table.gymId, table.paymentMethod),
    index("payments_gym_status_idx").on(table.gymId, table.paymentStatus),
    index("payments_member_idx").on(table.memberId),
    index("payments_membership_idx").on(table.membershipId),
    check("amount_positive", sql`${table.amount} > 0`),
  ]
);
