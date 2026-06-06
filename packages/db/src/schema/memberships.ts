import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  text,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { gyms } from "./gyms.js";
import { users } from "./users.js";
import { members } from "./members.js";
import { membershipStatusEnum, freezeStatusEnum } from "./enums.js";

export const membershipPlans = pgTable(
  "membership_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    durationDays: integer("duration_days").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("membership_plans_gym_name_uniq").on(table.gymId, table.name),
    index("membership_plans_gym_active_idx").on(table.gymId, table.isActive),
    check("duration_positive", sql`${table.durationDays} > 0`),
    check("price_non_negative", sql`${table.price} >= 0`),
  ]
);

export const memberMemberships = pgTable(
  "member_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => membershipPlans.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: membershipStatusEnum("status").notNull().default("active"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    paidAmount: numeric("paid_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("member_memberships_member_idx").on(table.memberId),
    index("member_memberships_gym_status_idx").on(table.gymId, table.status),
    index("member_memberships_end_date_idx").on(table.gymId, table.endDate),
    check("end_after_start", sql`${table.endDate} >= ${table.startDate}`),
    check("discount_within_total", sql`${table.discountAmount} <= ${table.totalAmount}`),
    check("paid_within_net", sql`${table.paidAmount} <= (${table.totalAmount} - ${table.discountAmount})`),
  ]
);

export const membershipFreezes = pgTable(
  "membership_freezes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberMemberships.id, { onDelete: "restrict" }),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    freezeStart: date("freeze_start").notNull(),
    freezeEnd: date("freeze_end"),
    reason: text("reason"),
    status: freezeStatusEnum("status").notNull().default("active"),
    daysAdded: integer("days_added").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("membership_freezes_membership_idx").on(table.membershipId),
    index("membership_freezes_gym_status_idx").on(table.gymId, table.status),
    check(
      "freeze_end_after_start",
      sql`${table.freezeEnd} IS NULL OR ${table.freezeEnd} >= ${table.freezeStart}`
    ),
  ]
);
