import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./expense-categories.service.js";

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
  const cat = await svc.createCategory(ctx(req), req.body);
  sendSuccess(res, { category: cat }, undefined, 201);
});

export const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const categories = await svc.listCategories(ctx(req), includeInactive);
  sendSuccess(res, { categories });
});

export const getById = asyncHandler(async (req, res) => {
  const cat = await svc.getCategoryById(ctx(req), req.params.id!);
  sendSuccess(res, { category: cat });
});

export const update = asyncHandler(async (req, res) => {
  const cat = await svc.updateCategory(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { category: cat });
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const cat = await svc.toggleCategoryStatus(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { category: cat });
});
