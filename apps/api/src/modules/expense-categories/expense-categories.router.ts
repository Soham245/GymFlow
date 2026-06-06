import { Router } from "express";
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  toggleCategoryStatusSchema,
  idParamSchema,
} from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./expense-categories.controller.js";

export const expenseCategoriesRouter = Router();

expenseCategoriesRouter.get("/", controller.list);

expenseCategoriesRouter.post(
  "/",
  authorize("owner"),
  validate(createExpenseCategorySchema),
  controller.create
);

expenseCategoriesRouter.get("/:id", validate(idParamSchema, "params"), controller.getById);

expenseCategoriesRouter.patch(
  "/:id",
  authorize("owner"),
  validate(idParamSchema, "params"),
  validate(updateExpenseCategorySchema),
  controller.update
);

expenseCategoriesRouter.patch(
  "/:id/status",
  authorize("owner"),
  validate(idParamSchema, "params"),
  validate(toggleCategoryStatusSchema),
  controller.toggleStatus
);
