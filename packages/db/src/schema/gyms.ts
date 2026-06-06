import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const gyms = pgTable("gyms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  logoUrl: text("logo_url"),
  timezone: varchar("timezone", { length: 50 }).notNull().default("Asia/Kolkata"),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
