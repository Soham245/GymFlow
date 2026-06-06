import { pgEnum } from "drizzle-orm/pg-core";

// ─── User & Access ──────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "receptionist",
  "trainer",
]);

// ─── Member ─────────────────────────────────────────────────────
export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "expired",
  "inactive",
  "frozen",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

// ─── Membership ─────────────────────────────────────────────────
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "expired",
  "cancelled",
  "frozen",
]);

export const freezeStatusEnum = pgEnum("freeze_status", [
  "active",
  "completed",
  "cancelled",
]);

// ─── Payment ────────────────────────────────────────────────────
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "card",
  "bank_transfer",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "partial",
  "pending",
  "refunded",
]);

// ─── Notification ───────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
  "welcome",
  "renewal_reminder",
  "expiry_notice",
  "payment_receipt",
  "freeze_notice",
  "daily_summary",
  "custom",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "whatsapp",
  "sms",
  "email",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

// ─── Audit ──────────────────────────────────────────────────────
export const auditActionEnum = pgEnum("audit_action", [
  "member_created",
  "member_updated",
  "member_status_changed",
  "membership_created",
  "membership_renewed",
  "membership_cancelled",
  "membership_frozen",
  "membership_unfrozen",
  "payment_created",
  "payment_voided",
  "expense_created",
  "expense_updated",
  "expense_deleted",
  "plan_created",
  "plan_updated",
  "user_created",
  "user_updated",
  "user_login",
  "user_logout",
  "gym_updated",
]);
