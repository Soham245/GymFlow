import { z } from "zod";
import { dateStringSchema } from "./common.js";

export const reportPeriodSchema = z.enum([
  "today",
  "this_week",
  "this_month",
  "last_month",
  "last_30_days",
  "last_90_days",
  "this_year",
  "all_time",
  "custom",
]);

export const reportQuerySchema = z.object({
  period: reportPeriodSchema.default("this_month"),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});

export const analyticsQuerySchema = z.object({
  range: reportPeriodSchema.default("this_month"),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});

export type ReportPeriod = z.infer<typeof reportPeriodSchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
