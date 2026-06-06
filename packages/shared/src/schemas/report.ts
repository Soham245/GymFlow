import { z } from "zod";
import { dateStringSchema } from "./common.js";

export const reportPeriodSchema = z.enum([
  "today",
  "this_week",
  "this_month",
  "last_month",
  "this_year",
  "all_time",
  "custom",
]);

export const reportQuerySchema = z.object({
  period: reportPeriodSchema.default("this_month"),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});

export type ReportPeriod = z.infer<typeof reportPeriodSchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
