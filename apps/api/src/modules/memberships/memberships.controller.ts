import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./memberships.service.js";

function ctx(req: Request) {
  return {
    db: getDb(),
    gymId: req.gymId!,
    userId: req.user!.userId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.listAllMemberships(ctx(req), {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    status: req.query.status as string | undefined,
    search: req.query.search as string | undefined,
    planId: req.query.planId as string | undefined,
    expiringSoon: req.query.expiringSoon === "true",
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: req.query.sortOrder as string | undefined,
  });
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const membership = await svc.createMembership(ctx(req), req.params.memberId!, req.body);
  sendSuccess(res, { membership }, undefined, 201);
});

export const listForMember = asyncHandler(async (req: Request, res: Response) => {
  const memberships = await svc.listMemberMemberships(ctx(req), req.params.memberId!);
  sendSuccess(res, { memberships });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const membership = await svc.getMembershipById(ctx(req), req.params.id!);
  sendSuccess(res, { membership });
});

export const renew = asyncHandler(async (req: Request, res: Response) => {
  const membership = await svc.renewMembership(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { membership }, undefined, 201);
});

export const freeze = asyncHandler(async (req: Request, res: Response) => {
  const freezeRecord = await svc.freezeMembership(ctx(req), req.params.id!, req.body);
  sendSuccess(res, { freeze: freezeRecord }, undefined, 201);
});

export const unfreeze = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.unfreezeMembership(ctx(req), req.params.id!, req.body);
  sendSuccess(res, result);
});
