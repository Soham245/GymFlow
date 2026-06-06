import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./reports.service.js";

function ctx(req: Request) {
  return { db: getDb(), gymId: req.gymId! };
}

export const revenue = asyncHandler(async (req: Request & { validatedQuery?: any }, res: Response) => {
  const query = req.validatedQuery ?? req.query;
  const report = await svc.revenueReport(ctx(req), query as any);
  sendSuccess(res, report);
});

export const expenseReport = asyncHandler(async (req: Request & { validatedQuery?: any }, res: Response) => {
  const query = req.validatedQuery ?? req.query;
  const report = await svc.expenseReport(ctx(req), query as any);
  sendSuccess(res, report);
});

export const profit = asyncHandler(async (req: Request & { validatedQuery?: any }, res: Response) => {
  const query = req.validatedQuery ?? req.query;
  const report = await svc.profitReport(ctx(req), query as any);
  sendSuccess(res, report);
});

export const memberships = asyncHandler(async (req: Request, res: Response) => {
  const report = await svc.membershipReport(ctx(req));
  sendSuccess(res, report);
});

export const outstandingBalances = asyncHandler(async (req: Request, res: Response) => {
  const report = await svc.outstandingBalances(ctx(req));
  sendSuccess(res, report);
});
