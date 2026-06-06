import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as svc from "./dashboard.service.js";

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await svc.getDashboard({
    db: getDb(),
    gymId: req.gymId!,
  });
  sendSuccess(res, dashboard);
});
