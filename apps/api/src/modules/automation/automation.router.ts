import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./automation.controller.js";

export const automationRouter = Router();

// All automation endpoints restricted to owner
automationRouter.get("/expiring-memberships", authorize("owner"), controller.expiringMemberships);
automationRouter.get("/expired-memberships", authorize("owner"), controller.expiredMemberships);
automationRouter.get("/daily-summary", authorize("owner"), controller.dailySummary);
automationRouter.get("/backup-status", authorize("owner"), controller.backupStatus);
