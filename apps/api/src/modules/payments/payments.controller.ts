import type { Request, Response } from "express";
import { getDb } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { generateReceiptPdf } from "../../utils/pdf-receipt.js";
import * as svc from "./payments.service.js";

function ctx(req: Request) {
  return {
    db: getDb(),
    gymId: req.gymId!,
    userId: req.user!.userId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

export const record = asyncHandler(async (req: Request, res: Response) => {
  const payment = await svc.recordPayment(ctx(req), req.body);
  sendSuccess(res, { payment }, undefined, 201);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await svc.getPaymentById(ctx(req), req.params.id!);
  sendSuccess(res, { payment });
});

export const list = asyncHandler(async (req: Request & { validatedQuery?: unknown }, res: Response) => {
  const result = await svc.listPayments(ctx(req), (req.validatedQuery ?? req.query) as any);
  sendSuccess(res, { payments: result.items }, {
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  } as any);
});

export const membershipPayments = asyncHandler(async (req: Request, res: Response) => {
  const paymentList = await svc.listMembershipPayments(ctx(req), req.params.id!);
  sendSuccess(res, { payments: paymentList });
});

export const memberPayments = asyncHandler(async (req: Request, res: Response) => {
  const paymentList = await svc.listMemberPayments(ctx(req), req.params.memberId!);
  sendSuccess(res, { payments: paymentList });
});

export const downloadReceipt = asyncHandler(async (req: Request, res: Response) => {
  const payment = await svc.getPaymentById(ctx(req), req.params.id!);

  generateReceiptPdf(res, {
    receiptNumber: payment.receiptNumber,
    gymName: payment.gymName,
    gymAddress: payment.gymAddress ?? undefined,
    gymPhone: payment.gymPhone ?? undefined,
    memberName: payment.memberName,
    memberPhone: payment.memberPhone,
    planName: payment.planName ?? undefined,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate,
    notes: payment.notes ?? undefined,
    createdAt: payment.createdAt.toISOString(),
  });
});
