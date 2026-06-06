import { Router } from "express";
import { authenticate } from "./middleware/authenticate.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { membersRouter } from "./modules/members/members.router.js";
import { plansRouter } from "./modules/plans/plans.router.js";
import {
  membershipsRouter,
  memberMembershipsRouter,
} from "./modules/memberships/memberships.router.js";
import {
  paymentsRouter,
  membershipPaymentsRouter,
  memberPaymentsRouter,
} from "./modules/payments/payments.router.js";
import { expenseCategoriesRouter } from "./modules/expense-categories/expense-categories.router.js";
import { expensesRouter } from "./modules/expenses/expenses.router.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.router.js";
import { reportsRouter } from "./modules/reports/reports.router.js";
import { automationRouter } from "./modules/automation/automation.router.js";
import { exportsRouter } from "./modules/exports/exports.router.js";

export const router = Router();

// ─── Public Routes ──────────────────────────────────────────────
router.use("/auth", authRouter);

// ─── Protected Routes (all require authentication) ─────────────
router.use(authenticate);

router.use("/dashboard", dashboardRouter);
router.use("/members", membersRouter);
router.use("/members/:memberId/memberships", memberMembershipsRouter);
router.use("/members/:memberId/payments", memberPaymentsRouter);
router.use("/membership-plans", plansRouter);
router.use("/memberships", membershipsRouter);
router.use("/memberships/:id/payments", membershipPaymentsRouter);
router.use("/payments", paymentsRouter);
router.use("/expense-categories", expenseCategoriesRouter);
router.use("/expenses", expensesRouter);
router.use("/reports", reportsRouter);
router.use("/automation", automationRouter);
router.use("/exports", exportsRouter);
