import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./notifications.service.js";
import * as automationRunner from "./automation-runner.service.js";

function ctx(req: Request) {
  return {
    db: getDb(),
    gymId: req.gymId!,
  };
}

export const list = asyncHandler(async (req: Request & { validatedQuery?: unknown }, res: Response) => {
  const result = await svc.getNotifications(ctx(req), (req.validatedQuery ?? req.query) as any);
  sendSuccess(res, { notifications: result.items }, {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  } as any);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await svc.getUnreadCount(ctx(req));
  sendSuccess(res, { unreadCount: count });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await svc.markAsRead(ctx(req), req.params.id!);
  sendSuccess(res, { notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await svc.markAllAsRead(ctx(req));
  sendSuccess(res, result);
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteNotification(ctx(req), req.params.id!);
  sendSuccess(res, { deleted: true });
});

export const runAutomation = asyncHandler(async (req, res) => {
  const result = await automationRunner.runAllAutomations(ctx(req));
  sendSuccess(res, result);
});
