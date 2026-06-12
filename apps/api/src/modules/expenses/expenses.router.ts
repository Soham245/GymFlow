import { Router } from "express";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
  idParamSchema,
} from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./expenses.controller.js";

export const expensesRouter = Router();

expensesRouter.get(
  "/",
  validate(listExpensesSchema, "query"),
  controller.list
);

expensesRouter.post(
  "/",
  authorize("owner", "receptionist"),
  validate(createExpenseSchema),
  controller.create
);

// Batch delete MUST be above /:id routes to avoid "batch-delete" matching as a UUID param
expensesRouter.post(
  "/batch-delete",
  authorize("owner"),
  controller.batchDelete
);

expensesRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  controller.getById
);

expensesRouter.patch(
  "/:id",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(updateExpenseSchema),
  controller.update
);
