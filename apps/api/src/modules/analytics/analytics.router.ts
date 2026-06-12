import { Router } from "express";
import { analyticsQuerySchema } from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import * as controller from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", validate(analyticsQuerySchema, "query"), controller.analytics);
