import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as authService from "./auth.service.js";

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = getDb();
  const { user, tokens } = await authService.login(db, email, password);

  sendSuccess(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
    },
    tokens,
  });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const db = getDb();
  const tokens = await authService.refresh(db, refreshToken);

  sendSuccess(res, { tokens });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const db = getDb();
  await authService.logout(db, refreshToken);

  sendSuccess(res, { message: "Logged out successfully" });
});

export const logoutAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const db = getDb();
  const { revokedCount } = await authService.logoutAll(db, req.user!.userId);

  sendSuccess(res, {
    message: "Logged out from all devices",
    revokedCount,
  });
});

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const db = getDb();
  const user = await authService.getMe(db, req.user!.userId);

  sendSuccess(res, { user });
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const db = getDb();
  await authService.changePassword(db, req.user!.userId, currentPassword, newPassword);

  sendSuccess(res, { message: "Password changed successfully. Please login again." });
});
