import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as membersService from "./members.service.js";

function getContext(req: Request) {
  return {
    db: getDb(),
    gymId: req.gymId!,
    userId: req.user!.userId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const member = await membersService.createMember(getContext(req), req.body);
  sendSuccess(res, { member }, undefined, 201);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const member = await membersService.getMemberById(getContext(req), req.params.id!);
  sendSuccess(res, { member });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const member = await membersService.updateMember(getContext(req), req.params.id!, req.body);
  sendSuccess(res, { member });
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const member = await membersService.changeMemberStatus(getContext(req), req.params.id!, req.body);
  sendSuccess(res, { member });
});

export const list = asyncHandler(async (req: Request & { validatedQuery?: unknown }, res: Response) => {
  const result = await membersService.listMembers(getContext(req), (req.validatedQuery ?? req.query) as any);
  sendSuccess(res, { members: result.items }, {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  } as any);
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await membersService.addNote(getContext(req), req.params.id!, req.body);
  sendSuccess(res, { note }, undefined, 201);
});

export const listNotes = asyncHandler(async (req: Request, res: Response) => {
  const notes = await membersService.listNotes(getContext(req), req.params.id!);
  sendSuccess(res, { notes });
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  await membersService.deleteNote(getContext(req), req.params.id!, req.params.noteId!);
  sendSuccess(res, { message: "Note deleted" });
});
