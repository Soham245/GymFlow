import {
  pgTable,
  uuid,
  varchar,
  numeric,
  text,
  date,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { gyms } from "./gyms.js";
import { users } from "./users.js";
import { paymentMethodEnum } from "./enums.js";

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("expense_categories_gym_name_uniq").on(table.gymId, table.name),
    index("expense_categories_gym_active_idx").on(table.gymId, table.isActive),
  ]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => gyms.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    expenseDate: date("expense_date").notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("expenses_gym_date_idx").on(table.gymId, table.expenseDate),
    index("expenses_gym_category_idx").on(table.gymId, table.categoryId),
    check("expense_amount_positive", sql`${table.amount} > 0`),
  ]
);
