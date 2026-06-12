import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getFullAnalytics } from "./analytics.service.js";
import { sendCsv } from "../../utils/export.js";
import { analyticsExportColumns, flattenAnalyticsForExport } from "./analytics.export.js";
import type { AnalyticsQuery } from "@gymflow/shared";

function ctx(req: Request) {
  return { db: getDb(), gymId: req.gymId! };
}

export const analytics = asyncHandler(async (req: Request & { validatedQuery?: any }, res: Response) => {
  const query: AnalyticsQuery = req.validatedQuery ?? req.query;
  const filter = { range: query.range, from: query.from, to: query.to };
  const data = await getFullAnalytics(ctx(req), filter);

  if (query.format === "csv") {
    const rows = flattenAnalyticsForExport(data);
    return sendCsv(res, "analytics-report.csv", analyticsExportColumns, rows);
  }

  sendSuccess(res, data);
});
