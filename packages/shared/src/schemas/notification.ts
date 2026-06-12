import { z } from "zod";
import { paginationSchema } from "./common.js";

export const IN_APP_NOTIFICATION_TYPES = [
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
] as const;

export type InAppNotificationType = (typeof IN_APP_NOTIFICATION_TYPES)[number];

export const listNotificationsSchema = paginationSchema.extend({
  type: z.enum(IN_APP_NOTIFICATION_TYPES).optional(),
  isRead: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
