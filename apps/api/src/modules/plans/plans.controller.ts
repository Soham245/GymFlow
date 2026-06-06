import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as plansService from "./plans.service.js";

function ctx(req: Request) {
  return {
    db: getDb(),
    gymId: req.gymId!,
    userId: req.user!.userId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const plan = await plansService.createPlan(ctx(req), req.body);
  sendSuccess(res, { plan }, undefined, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === "true";
  const plans = await plansService.listPlans(ctx(req), includeInactive);
  sendSuccess(res, { plans });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const plan = await plansService.getPlanById(ctx(req), req.params.id!);
  sendSuccess(res, { plan });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const plan = await plansService.updatePlan(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { plan });
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const plan = await plansService.togglePlanStatus(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { plan });
});
