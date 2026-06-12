import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./automation.service.js";
import { createNotification } from "../notifications/notifications.service.js";

function ctx(req: Request) {
  return { db: getDb(), gymId: req.gymId! };
}

export const expiringMemberships = asyncHandler(async (req, res) => {
  const data = await svc.getExpiringMemberships(ctx(req));
  sendSuccess(res, data);
});

export const expiredMemberships = asyncHandler(async (req, res) => {
  const data = await svc.getExpiredMemberships(ctx(req));
  sendSuccess(res, data);
});

export const dailySummary = asyncHandler(async (req, res) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const data = await svc.getDailySummary(ctx(req), { from, to });
  sendSuccess(res, data);
});

export const generateDailySummary = asyncHandler(async (req, res) => {
  const c = ctx(req);
  const data = await svc.getDailySummary(c);

  await createNotification(c, {
    type: "daily_summary_available",
    title: "Daily Summary Ready",
    message: `Revenue: ${data.revenue.total} · Expenses: ${data.expenses.total} · Profit: ${data.profit} · New members: ${data.newMembers} · Renewals: ${data.renewals}`,
    metadata: {
      from: data.from,
      to: data.to,
      revenue: data.revenue.total,
      expenses: data.expenses.total,
      profit: data.profit,
      newMembers: data.newMembers,
      renewals: data.renewals,
    },
  });

  sendSuccess(res, { ...data, notificationCreated: true });
});

export const backupStatus = asyncHandler(async (req, res) => {
  const data = await svc.getBackupStatus(ctx(req));
  sendSuccess(res, data);
});
