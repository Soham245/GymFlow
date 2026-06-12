import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./expenses.service.js";

function ctx(req: Request) {
  return {
    db: getDb(),
    gymId: req.gymId!,
    userId: req.user!.userId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

export const create = asyncHandler(async (req, res) => {
  const expense = await svc.createExpense(ctx(req), req.body);
  sendSuccess(res, { expense }, undefined, 201);
});

export const getById = asyncHandler(async (req, res) => {
  const expense = await svc.getExpenseById(ctx(req), req.params.id!);
  sendSuccess(res, { expense });
});

export const update = asyncHandler(async (req, res) => {
  const expense = await svc.updateExpense(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { expense });
});

export const batchDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const result = await svc.batchDeleteExpenses(ctx(req), ids);
  sendSuccess(res, result);
});

export const list = asyncHandler(async (req: Request & { validatedQuery?: unknown }, res: Response) => {
  const result = await svc.listExpenses(ctx(req), (req.validatedQuery ?? req.query) as any);
  sendSuccess(res, { expenses: result.items }, {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  } as any);
});
