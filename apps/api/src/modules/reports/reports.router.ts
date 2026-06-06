import { Router } from "express";
import { reportQuerySchema } from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import * as controller from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.get("/revenue", validate(reportQuerySchema, "query"), controller.revenue);
reportsRouter.get("/expenses", validate(reportQuerySchema, "query"), controller.expenseReport);
reportsRouter.get("/profit", validate(reportQuerySchema, "query"), controller.profit);
reportsRouter.get("/memberships", controller.memberships);
reportsRouter.get("/outstanding-balances", controller.outstandingBalances);
