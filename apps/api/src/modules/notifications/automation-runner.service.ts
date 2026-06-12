import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  memberMemberships,
  membershipPlans,
  members,
  membershipFreezes,
} from "@gymflow/db";
import type { Database } from "@gymflow/db";
import type { InAppNotificationType } from "@gymflow/shared";
import { addDays, daysBetween } from "@gymflow/shared";
import * as notifSvc from "./notifications.service.js";
import { toMoney } from "../../utils/money.js";
import { createAuditLog } from "../../utils/audit.js";

interface Ctx {
  db: Database;
  gymId: string;
}

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function futureStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Membership Expiry Automation ───────────────────────────────

async function runExpiryAutomation(ctx: Ctx): Promise<number> {
  const { db, gymId } = ctx;
  const today = todayStr();
  let created = 0;

  const expiryTypes: InAppNotificationType[] = [
    "membership_expiring_today",
    "membership_expiring_3_days",
    "membership_expiring_7_days",
    "membership_expired",
  ];

  const existingKeys = await notifSvc.getExistingNotificationKeys(ctx, expiryTypes, "membership");

  const tiers: Array<{
    type: InAppNotificationType;
    fromDate: string;
    toDate: string;
    labelPrefix: string;
  }> = [
    {
      type: "membership_expiring_today",
      fromDate: today,
      toDate: today,
      labelPrefix: "expires today",
    },
    {
      type: "membership_expiring_3_days",
      fromDate: futureStr(1),
      toDate: futureStr(3),
      labelPrefix: "expires in 3 days",
    },
    {
      type: "membership_expiring_7_days",
      fromDate: futureStr(4),
      toDate: futureStr(7),
      labelPrefix: "expires in 7 days",
    },
  ];

  for (const tier of tiers) {
    const rows = await db
      .select({
        membershipId: memberMemberships.id,
        memberId: memberMemberships.memberId,
        memberName: members.name,
        planName: membershipPlans.name,
        endDate: memberMemberships.endDate,
      })
      .from(memberMemberships)
      .innerJoin(members, eq(memberMemberships.memberId, members.id))
      .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
      .where(
        and(
          eq(memberMemberships.gymId, gymId),
          eq(memberMemberships.status, "active"),
          gte(memberMemberships.endDate, tier.fromDate),
          lte(memberMemberships.endDate, tier.toDate)
        )
      );

    for (const row of rows) {
      if (existingKeys.has(`${tier.type}::${row.membershipId}`)) continue;

      const inserted = await notifSvc.createNotificationSafe(ctx, {
        type: tier.type,
        title: `Membership ${tier.labelPrefix}`,
        message: `${row.memberName}'s ${row.planName} membership ${tier.labelPrefix} (${row.endDate}).`,
        relatedEntityType: "membership",
        relatedEntityId: row.membershipId,
        metadata: { memberName: row.memberName, memberId: row.memberId, planName: row.planName, endDate: row.endDate },
      });
      if (inserted) created++;
    }
  }

  // Expired memberships (past end date, still status=active)
  const expired = await db
    .select({
      membershipId: memberMemberships.id,
      memberId: memberMemberships.memberId,
      memberName: members.name,
      planName: membershipPlans.name,
      endDate: memberMemberships.endDate,
    })
    .from(memberMemberships)
    .innerJoin(members, eq(memberMemberships.memberId, members.id))
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(memberMemberships.gymId, gymId),
        eq(memberMemberships.status, "active"),
        sql`${memberMemberships.endDate}::date < CURRENT_DATE`
      )
    );

  for (const row of expired) {
    if (existingKeys.has(`membership_expired::${row.membershipId}`)) continue;

    const inserted = await notifSvc.createNotificationSafe(ctx, {
      type: "membership_expired",
      title: "Membership expired",
      message: `${row.memberName}'s ${row.planName} membership expired on ${row.endDate}.`,
      relatedEntityType: "membership",
      relatedEntityId: row.membershipId,
      metadata: { memberName: row.memberName, memberId: row.memberId, planName: row.planName, endDate: row.endDate },
    });
    if (inserted) created++;
  }

  return created;
}

// ─── Outstanding Balance Automation ─────────────────────────────

async function runOutstandingAutomation(ctx: Ctx): Promise<number> {
  const { db, gymId } = ctx;

  // Delete all existing outstanding_balance notifications, then regenerate fresh
  await notifSvc.deleteNotificationsByType(ctx, "outstanding_balance");

  const rows = await db
    .select({
      membershipId: memberMemberships.id,
      memberId: memberMemberships.memberId,
      memberName: members.name,
      planName: membershipPlans.name,
      outstanding: sql<number>`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount})`,
    })
    .from(memberMemberships)
    .innerJoin(members, eq(memberMemberships.memberId, members.id))
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(memberMemberships.gymId, gymId),
        eq(memberMemberships.status, "active"),
        sql`(${memberMemberships.totalAmount} - ${memberMemberships.discountAmount} - ${memberMemberships.paidAmount}) > 0`
      )
    );

  let created = 0;
  for (const row of rows) {
    await notifSvc.createNotificationSafe(ctx, {
      type: "outstanding_balance",
      title: "Outstanding balance",
      message: `${row.memberName} has ₹${toMoney(row.outstanding)} outstanding for ${row.planName}.`,
      relatedEntityType: "membership",
      relatedEntityId: row.membershipId,
      metadata: { memberName: row.memberName, memberId: row.memberId, planName: row.planName, outstanding: toMoney(row.outstanding) },
    });
    created++;
  }

  return created;
}

// ─── Freeze Ending Automation ───────────────────────────────────

async function runFreezeAutomation(ctx: Ctx): Promise<number> {
  const { db, gymId } = ctx;
  const today = todayStr();
  const tomorrow = futureStr(1);
  let created = 0;

  const existingKeys = await notifSvc.getExistingNotificationKeys(ctx, ["freeze_ending"], "freeze");

  const tiers: Array<{
    type: InAppNotificationType;
    date: string;
    label: string;
  }> = [
    { type: "freeze_ending", date: today, label: "ending today" },
    { type: "freeze_ending", date: tomorrow, label: "ending tomorrow" },
  ];

  for (const tier of tiers) {
    const rows = await db
      .select({
        freezeId: membershipFreezes.id,
        membershipId: membershipFreezes.membershipId,
        memberId: memberMemberships.memberId,
        memberName: members.name,
        freezeEnd: membershipFreezes.freezeEnd,
      })
      .from(membershipFreezes)
      .innerJoin(memberMemberships, eq(membershipFreezes.membershipId, memberMemberships.id))
      .innerJoin(members, eq(memberMemberships.memberId, members.id))
      .where(
        and(
          eq(membershipFreezes.gymId, gymId),
          eq(membershipFreezes.status, "active"),
          eq(membershipFreezes.freezeEnd, tier.date)
        )
      );

    for (const row of rows) {
      if (existingKeys.has(`freeze_ending::${row.freezeId}`)) continue;

      const inserted = await notifSvc.createNotificationSafe(ctx, {
        type: "freeze_ending",
        title: `Freeze ${tier.label}`,
        message: `${row.memberName}'s membership freeze is ${tier.label}.`,
        relatedEntityType: "freeze",
        relatedEntityId: row.freezeId,
        metadata: { memberName: row.memberName, memberId: row.memberId, membershipId: row.membershipId, freezeEnd: row.freezeEnd },
      });
      if (inserted) created++;
    }
  }

  return created;
}

// ─── Aggregate Member Status ───────────────────────────────────

const STATUS_PRECEDENCE: Record<string, number> = { active: 3, frozen: 2, expired: 1 };

async function deriveMemberStatus(
  db: Database,
  memberId: string
): Promise<"active" | "frozen" | "expired"> {
  const allMs = await db
    .select({ status: memberMemberships.status })
    .from(memberMemberships)
    .where(eq(memberMemberships.memberId, memberId));

  let best: "active" | "frozen" | "expired" = "expired";
  for (const m of allMs) {
    const s = m.status as "active" | "frozen" | "expired" | "cancelled";
    if (s === "cancelled") continue;
    if ((STATUS_PRECEDENCE[s] ?? 0) > (STATUS_PRECEDENCE[best] ?? 0)) {
      best = s as "active" | "frozen" | "expired";
    }
  }
  return best;
}

async function reconcileMemberStatus(db: Database, memberId: string) {
  const derived = await deriveMemberStatus(db, memberId);
  await db
    .update(members)
    .set({ status: derived, updatedAt: new Date() })
    .where(eq(members.id, memberId));
  return derived;
}

// ─── Auto-Expire Memberships (Lifecycle) ───────────────────────

async function runAutoExpireLifecycle(ctx: Ctx): Promise<number> {
  const { db, gymId } = ctx;

  const rows = await db
    .select({
      membershipId: memberMemberships.id,
      memberId: memberMemberships.memberId,
      memberName: members.name,
      memberStatus: members.status,
      planName: membershipPlans.name,
      endDate: memberMemberships.endDate,
    })
    .from(memberMemberships)
    .innerJoin(members, eq(memberMemberships.memberId, members.id))
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(memberMemberships.gymId, gymId),
        eq(memberMemberships.status, "active"),
        sql`${memberMemberships.endDate}::date < CURRENT_DATE`
      )
    );

  let transitioned = 0;
  for (const row of rows) {
    await db
      .update(memberMemberships)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(memberMemberships.id, row.membershipId));

    const previousMemberStatus = row.memberStatus;
    const newMemberStatus = await reconcileMemberStatus(db, row.memberId);

    await createAuditLog(db, {
      gymId,
      action: "membership_auto_expired",
      entityType: "member_membership",
      entityId: row.membershipId,
      oldValues: { status: "active", endDate: row.endDate, memberStatus: previousMemberStatus },
      newValues: { status: "expired", memberStatus: newMemberStatus, trigger: "automation" },
    });

    await notifSvc.createNotificationSafe(ctx, {
      type: "membership_auto_expired",
      title: "Membership auto-expired",
      message: `${row.memberName}'s ${row.planName} membership was automatically expired (ended ${row.endDate}).`,
      relatedEntityType: "membership",
      relatedEntityId: row.membershipId,
      metadata: { memberName: row.memberName, memberId: row.memberId, planName: row.planName, endDate: row.endDate },
    });
    transitioned++;
  }

  return transitioned;
}

// ─── Auto-Unfreeze Memberships (Lifecycle) ─────────────────────

async function runAutoUnfreezeLifecycle(ctx: Ctx): Promise<number> {
  const { db, gymId } = ctx;

  const rows = await db
    .select({
      freezeId: membershipFreezes.id,
      membershipId: membershipFreezes.membershipId,
      memberId: memberMemberships.memberId,
      memberName: members.name,
      memberStatus: members.status,
      planName: membershipPlans.name,
      freezeStart: membershipFreezes.freezeStart,
      freezeEnd: membershipFreezes.freezeEnd,
      membershipEndDate: memberMemberships.endDate,
      membershipStatus: memberMemberships.status,
    })
    .from(membershipFreezes)
    .innerJoin(memberMemberships, eq(membershipFreezes.membershipId, memberMemberships.id))
    .innerJoin(members, eq(memberMemberships.memberId, members.id))
    .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(membershipFreezes.gymId, gymId),
        eq(membershipFreezes.status, "active"),
        sql`${membershipFreezes.freezeEnd}::date <= CURRENT_DATE`
      )
    );

  let transitioned = 0;
  for (const row of rows) {
    if (!row.freezeEnd) continue;

    const freezeStartDate = new Date(row.freezeStart);
    const freezeEndDate = new Date(row.freezeEnd);
    const daysToAdd = daysBetween(freezeStartDate, freezeEndDate);

    await db
      .update(membershipFreezes)
      .set({ status: "completed", daysAdded: daysToAdd })
      .where(eq(membershipFreezes.id, row.freezeId));

    const currentEnd = new Date(row.membershipEndDate);
    const newEnd = addDays(currentEnd, daysToAdd);
    const newEndStr = newEnd.toISOString().split("T")[0]!;

    await db
      .update(memberMemberships)
      .set({ status: "active", endDate: newEndStr, updatedAt: new Date() })
      .where(eq(memberMemberships.id, row.membershipId));

    const previousMemberStatus = row.memberStatus;
    const newMemberStatus = await reconcileMemberStatus(db, row.memberId);

    await createAuditLog(db, {
      gymId,
      action: "membership_auto_unfrozen",
      entityType: "member_membership",
      entityId: row.membershipId,
      oldValues: {
        status: row.membershipStatus,
        endDate: row.membershipEndDate,
        memberStatus: previousMemberStatus,
        freezeId: row.freezeId,
      },
      newValues: {
        status: "active",
        endDate: newEndStr,
        memberStatus: newMemberStatus,
        daysAdded: daysToAdd,
        trigger: "automation",
      },
    });

    await notifSvc.createNotificationSafe(ctx, {
      type: "membership_auto_unfrozen",
      title: "Membership auto-reactivated",
      message: `${row.memberName}'s ${row.planName} membership was automatically reactivated after freeze ended. End date extended to ${newEndStr}.`,
      relatedEntityType: "membership",
      relatedEntityId: row.membershipId,
      metadata: {
        memberName: row.memberName,
        memberId: row.memberId,
        planName: row.planName,
        freezeId: row.freezeId,
        daysAdded: daysToAdd,
        previousEndDate: row.membershipEndDate,
        newEndDate: newEndStr,
      },
    });
    transitioned++;
  }

  return transitioned;
}

// ─── Run All Automations ────────────────────────────────────────

export async function runAllAutomations(ctx: Ctx) {
  // Lifecycle: sequential — unfreeze first, then expire.
  // Unfreezing may reactivate memberships with extended dates that are still valid,
  // so expire must run second to correctly evaluate the updated end dates.
  const membershipsUnfrozen = await runAutoUnfreezeLifecycle(ctx);
  const membershipsExpired = await runAutoExpireLifecycle(ctx);

  const [expiryNotifications, balanceNotifications, freezeNotifications] = await Promise.all([
    runExpiryAutomation(ctx),
    runOutstandingAutomation(ctx),
    runFreezeAutomation(ctx),
  ]);

  return {
    lifecycle: {
      membershipsExpired,
      membershipsUnfrozen,
    },
    notificationsCreated: expiryNotifications + balanceNotifications + freezeNotifications,
    expiryNotifications,
    balanceNotifications,
    freezeNotifications,
  };
}
