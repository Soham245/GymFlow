/**
 * db:reset — DEVELOPMENT ONLY
 *
 * Truncates ALL tables and reseeds the database from scratch.
 * This is destructive and irreversible. Never run against production.
 *
 * Usage: pnpm db:reset
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { seed } from "./seed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

async function reset() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  // ── Safety gate: block production usage ──────────────────────
  if (process.env.NODE_ENV === "production") {
    console.error("\n╔══════════════════════════════════════════════════╗");
    console.error("║  ABORTED: db:reset cannot run in production!     ║");
    console.error("║  Use db:seed for non-destructive seeding.        ║");
    console.error("╚══════════════════════════════════════════════════╝\n");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  WARNING: This will TRUNCATE all tables and     ║");
  console.log("║  reseed the database. All existing data will    ║");
  console.log("║  be permanently deleted.                        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const sql = neon(databaseUrl);

  // ─── 1. Truncate all tables ─────────────────────────────────
  console.log("Truncating all tables...");
  await sql(
    "TRUNCATE TABLE audit_logs, message_log, scheduled_messages, message_templates, notifications_log, member_notes, membership_freezes, payments, member_memberships, expenses, expense_categories, membership_plans, members, refresh_tokens, users, gyms CASCADE"
  );
  console.log("All tables cleared.\n");

  // ─── 2. Run seed ───────────────────────────────────────────
  console.log("Re-seeding database...\n");
  await seed();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
