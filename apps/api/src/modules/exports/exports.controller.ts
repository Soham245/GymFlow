import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendCsv, sendXlsx } from "../../utils/export.js";
import * as svc from "./exports.service.js";
import {
  memberColumns,
  revenueColumns,
  expenseColumns,
  outstandingColumns,
} from "./exports.columns.js";

function ctx(req: Request) {
  return { db: getDb(), gymId: req.gymId! };
}

function queryFromReq(req: Request & { validatedQuery?: any }) {
  return (req.validatedQuery ?? req.query) as any;
}

// ─── Members ────────────────────────────────────────────────────

export const membersCsv = asyncHandler(async (req, res) => {
  const rows = await svc.exportMembers(ctx(req));
  sendCsv(res, "members.csv", memberColumns, rows as any);
});

export const membersXlsx = asyncHandler(async (req, res) => {
  const rows = await svc.exportMembers(ctx(req));
  sendXlsx(res, "members.xlsx", "Members", memberColumns, rows as any);
});

// ─── Revenue ────────────────────────────────────────────────────

export const revenueCsv = asyncHandler(async (req: Request & { validatedQuery?: any }, res) => {
  const rows = await svc.exportRevenue(ctx(req), queryFromReq(req));
  sendCsv(res, "revenue.csv", revenueColumns, rows as any);
});

export const revenueXlsx = asyncHandler(async (req: Request & { validatedQuery?: any }, res) => {
  const rows = await svc.exportRevenue(ctx(req), queryFromReq(req));
  sendXlsx(res, "revenue.xlsx", "Revenue", revenueColumns, rows as any);
});

// ─── Expenses ───────────────────────────────────────────────────

export const expensesCsv = asyncHandler(async (req: Request & { validatedQuery?: any }, res) => {
  const rows = await svc.exportExpenses(ctx(req), queryFromReq(req));
  sendCsv(res, "expenses.csv", expenseColumns, rows as any);
});

export const expensesXlsx = asyncHandler(async (req: Request & { validatedQuery?: any }, res) => {
  const rows = await svc.exportExpenses(ctx(req), queryFromReq(req));
  sendXlsx(res, "expenses.xlsx", "Expenses", expenseColumns, rows as any);
});

// ─── Outstanding Balances ───────────────────────────────────────

export const outstandingCsv = asyncHandler(async (req, res) => {
  const rows = await svc.exportOutstandingBalances(ctx(req));
  sendCsv(res, "outstanding-balances.csv", outstandingColumns, rows as any);
});

export const outstandingXlsx = asyncHandler(async (req, res) => {
  const rows = await svc.exportOutstandingBalances(ctx(req));
  sendXlsx(res, "outstanding-balances.xlsx", "Outstanding", outstandingColumns, rows as any);
});
