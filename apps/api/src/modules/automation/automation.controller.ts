import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./automation.service.js";

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
  const data = await svc.getDailySummary(ctx(req));
  sendSuccess(res, data);
});

export const backupStatus = asyncHandler(async (req, res) => {
  const data = await svc.getBackupStatus(ctx(req));
  sendSuccess(res, data);
});
