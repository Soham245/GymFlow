export const USER_ROLES = ["owner", "receptionist", "trainer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBER_STATUSES = ["active", "expired", "inactive", "frozen"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const MEMBERSHIP_STATUSES = ["active", "expired", "cancelled", "frozen"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const FREEZE_STATUSES = ["active", "completed", "cancelled"] as const;
export type FreezeStatus = (typeof FREEZE_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["paid", "partial", "pending", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "welcome",
  "renewal_reminder",
  "expiry_notice",
  "payment_receipt",
  "freeze_notice",
  "daily_summary",
  "custom",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["whatsapp", "sms", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["pending", "sent", "failed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

// ─── Messaging ─────────────────────────────────────────────────

export const MESSAGE_TRIGGER_TYPES = [
  "member_created",
  "membership_expiring_7_days",
  "membership_expiring_3_days",
  "membership_expiring_1_day",
  "membership_expired",
  "payment_received",
  "manual",
] as const;
export type MessageTriggerType = (typeof MESSAGE_TRIGGER_TYPES)[number];

export const SCHEDULED_MESSAGE_STATUSES = [
  "draft",
  "scheduled",
  "sent",
  "cancelled",
] as const;
export type ScheduledMessageStatus = (typeof SCHEDULED_MESSAGE_STATUSES)[number];

export const MESSAGE_TRIGGER_LABELS: Record<MessageTriggerType, string> = {
  member_created: "New Member Welcome",
  membership_expiring_7_days: "Expiring in 7 Days",
  membership_expiring_3_days: "Expiring in 3 Days",
  membership_expiring_1_day: "Expiring Tomorrow",
  membership_expired: "Membership Expired",
  payment_received: "Payment Received",
  manual: "Manual Send",
};

export const SCHEDULED_MESSAGE_STATUS_LABELS: Record<ScheduledMessageStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  cancelled: "Cancelled",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
};

// ─── Template Variables ────────────────────────────────────────

export const TEMPLATE_VARIABLES = [
  "member_name",
  "member_phone",
  "gym_name",
  "membership_plan",
  "expiry_date",
  "amount_due",
  "payment_amount",
  "receipt_number",
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export const TEMPLATE_VARIABLE_LABELS: Record<TemplateVariable, string> = {
  member_name: "Member Name",
  member_phone: "Member Phone",
  gym_name: "Gym Name",
  membership_plan: "Plan Name",
  expiry_date: "Expiry Date",
  amount_due: "Amount Due",
  payment_amount: "Payment Amount",
  receipt_number: "Receipt Number",
};

// ─── Display Labels ────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  expired: "Expired",
  inactive: "Inactive",
  frozen: "Frozen",
};
