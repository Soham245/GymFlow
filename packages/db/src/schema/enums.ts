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

// ─── In-App Notification ────────────────────────────────────
export const inAppNotificationTypeEnum = pgEnum("in_app_notification_type", [
  "membership_expiring_7_days",
  "membership_expiring_3_days",
  "membership_expiring_today",
  "membership_expired",
  "outstanding_balance",
  "freeze_ending",
  "system",
  "membership_auto_expired",
  "membership_auto_unfrozen",
  "daily_summary_available",
]);

// ─── Audit ──────────────────────────────────────────────────────
export const auditActionEnum = pgEnum("audit_action", [
  "member_created",
  "member_updated",
  "member_deleted",
  "member_status_changed",
  "membership_created",
  "membership_renewed",
  "membership_cancelled",
  "membership_frozen",
  "membership_unfrozen",
  "membership_auto_expired",
  "membership_auto_unfrozen",
  "payment_created",
  "payment_updated",
  "payment_deleted",
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
