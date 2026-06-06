import { Router } from "express";
import { reportQuerySchema } from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import * as controller from "./exports.controller.js";

export const exportsRouter = Router();

// Members
exportsRouter.get("/members.csv", controller.membersCsv);
exportsRouter.get("/members.xlsx", controller.membersXlsx);

// Revenue (supports period filter)
exportsRouter.get("/revenue.csv", validate(reportQuerySchema, "query"), controller.revenueCsv);
exportsRouter.get("/revenue.xlsx", validate(reportQuerySchema, "query"), controller.revenueXlsx);

// Expenses (supports period filter)
exportsRouter.get("/expenses.csv", validate(reportQuerySchema, "query"), controller.expensesCsv);
exportsRouter.get("/expenses.xlsx", validate(reportQuerySchema, "query"), controller.expensesXlsx);

// Outstanding Balances
exportsRouter.get("/outstanding-balances.csv", controller.outstandingCsv);
exportsRouter.get("/outstanding-balances.xlsx", controller.outstandingXlsx);
