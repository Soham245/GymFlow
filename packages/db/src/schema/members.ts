import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { gyms } from "./gyms.js";
import { users } from "./users.js";
import { memberStatusEnum, genderEnum } from "./enums.js";

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    gender: genderEnum("gender"),
    dateOfBirth: date("date_of_birth"),
    address: text("address"),
    emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
    photoUrl: text("photo_url"),
    joinDate: date("join_date").notNull(),
    status: memberStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("members_gym_phone_uniq").on(table.gymId, table.phone),
    index("members_gym_status_idx").on(table.gymId, table.status),
    index("members_gym_name_idx").on(table.gymId, table.name),
    index("members_gym_join_date_idx").on(table.gymId, table.joinDate),
  ]
);

export const memberNotes = pgTable(
  "member_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("member_notes_member_idx").on(table.memberId),
  ]
);
