/**
 * One-time repair script: backfill memberId (and membershipId for freeze
 * notifications) into in_app_notifications metadata created before the
 * actionable-notifications upgrade.
 *
 * Safe to run multiple times — skips rows that already have the required keys.
 *
 * Usage:
 *   pnpm -C packages/db exec tsx src/scripts/backfill-notification-metadata.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = neon(databaseUrl);
const db = drizzle(client);

const MEMBERSHIP_TYPES = [
  "membership_expiring_7_days",
  "membership_expiring_3_days",
  "membership_expiring_today",
  "membership_expired",
  "membership_auto_expired",
  "membership_auto_unfrozen",
];

async function run() {
  console.log("=== Notification Metadata Backfill ===\n");

  // ── Step 1: Repair membership-based notifications ─────────────
  // These have related_entity_type = 'membership' and related_entity_id = membership UUID.
  // Resolve memberId from member_memberships.

  console.log("Step 1: Membership-based notifications (adding memberId)...");

  const membershipScan = await db.execute(sql`
    SELECT count(*) AS total
    FROM in_app_notifications
    WHERE type = ANY(${MEMBERSHIP_TYPES})
      AND related_entity_type = 'membership'
      AND related_entity_id IS NOT NULL
  `);
  const membershipTotal = Number(membershipScan.rows[0]?.total ?? 0);

  const membershipResult = await db.execute(sql`
    UPDATE in_app_notifications n
    SET metadata = COALESCE(n.metadata, '{}'::jsonb) || jsonb_build_object('memberId', mm.member_id::text)
    FROM member_memberships mm
    WHERE n.related_entity_type = 'membership'
      AND n.related_entity_id = mm.id
      AND n.type = ANY(${MEMBERSHIP_TYPES})
      AND (n.metadata IS NULL OR n.metadata->>'memberId' IS NULL)
  `);
  const membershipUpdated = membershipResult.rowCount ?? 0;

  console.log(`  Scanned:  ${membershipTotal}`);
  console.log(`  Updated:  ${membershipUpdated}`);
  console.log(`  Skipped:  ${membershipTotal - membershipUpdated}`);

  // ── Step 2: Repair freeze-based notifications ─────────────────
  // These have related_entity_type = 'freeze' and related_entity_id = freeze UUID.
  // Resolve membershipId and memberId through membership_freezes → member_memberships.

  console.log("\nStep 2: Freeze-based notifications (adding memberId + membershipId)...");

  const freezeScan = await db.execute(sql`
    SELECT count(*) AS total
    FROM in_app_notifications
    WHERE type = 'freeze_ending'
      AND related_entity_type = 'freeze'
      AND related_entity_id IS NOT NULL
  `);
  const freezeTotal = Number(freezeScan.rows[0]?.total ?? 0);

  const freezeResult = await db.execute(sql`
    UPDATE in_app_notifications n
    SET metadata = COALESCE(n.metadata, '{}'::jsonb)
      || jsonb_build_object('memberId', mm.member_id::text, 'membershipId', mf.membership_id::text)
    FROM membership_freezes mf
    JOIN member_memberships mm ON mf.membership_id = mm.id
    WHERE n.related_entity_type = 'freeze'
      AND n.related_entity_id = mf.id
      AND n.type = 'freeze_ending'
      AND (n.metadata IS NULL OR n.metadata->>'memberId' IS NULL)
  `);
  const freezeUpdated = freezeResult.rowCount ?? 0;

  console.log(`  Scanned:  ${freezeTotal}`);
  console.log(`  Updated:  ${freezeUpdated}`);
  console.log(`  Skipped:  ${freezeTotal - freezeUpdated}`);

  // ── Step 3: Verification ──────────────────────────────────────

  console.log("\n=== Verification ===\n");

  const missingMemberId = await db.execute(sql`
    SELECT count(*) AS total
    FROM in_app_notifications
    WHERE type = ANY(${[...MEMBERSHIP_TYPES, "freeze_ending"]})
      AND related_entity_id IS NOT NULL
      AND (metadata IS NULL OR metadata->>'memberId' IS NULL)
  `);
  const missingMemberIdCount = Number(missingMemberId.rows[0]?.total ?? 0);

  const missingMembershipId = await db.execute(sql`
    SELECT count(*) AS total
    FROM in_app_notifications
    WHERE type = 'freeze_ending'
      AND related_entity_type = 'freeze'
      AND related_entity_id IS NOT NULL
      AND (metadata IS NULL OR metadata->>'membershipId' IS NULL)
  `);
  const missingMembershipIdCount = Number(missingMembershipId.rows[0]?.total ?? 0);

  console.log(`Notifications still missing memberId:     ${missingMemberIdCount}`);
  console.log(`Freeze notifications missing membershipId: ${missingMembershipIdCount}`);

  if (missingMemberIdCount === 0 && missingMembershipIdCount === 0) {
    console.log("\nAll notifications have complete metadata.");
  } else {
    console.log("\nWARNING: Some notifications could not be resolved.");
    console.log("This can happen if the related entity was deleted.");
  }

  console.log("\n=== Summary ===");
  console.log(`Total repaired: ${membershipUpdated + freezeUpdated}`);
  console.log("Done.");
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
