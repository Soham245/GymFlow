import { Router } from "express";
import {
  createPlanSchema,
  updatePlanSchema,
  togglePlanStatusSchema,
  idParamSchema,
} from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./plans.controller.js";

export const plansRouter = Router();

plansRouter.get("/", controller.list);

plansRouter.post(
  "/",
  authorize("owner"),
  validate(createPlanSchema),
  controller.create
);

plansRouter.get("/:id", validate(idParamSchema, "params"), controller.getById);

plansRouter.patch(
  "/:id",
  authorize("owner"),
  validate(idParamSchema, "params"),
  validate(updatePlanSchema),
  controller.update
);

plansRouter.patch(
  "/:id/status",
  authorize("owner"),
  validate(idParamSchema, "params"),
  validate(togglePlanStatusSchema),
  controller.toggleStatus
);
