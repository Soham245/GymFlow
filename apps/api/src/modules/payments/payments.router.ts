import { Router } from "express";
import {
  createPaymentSchema,
  listPaymentsSchema,
  idParamSchema,
} from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./payments.controller.js";

// Mounted at /payments
export const paymentsRouter = Router();

paymentsRouter.post(
  "/",
  authorize("owner", "receptionist"),
  validate(createPaymentSchema),
  controller.record
);

paymentsRouter.get(
  "/",
  validate(listPaymentsSchema, "query"),
  controller.list
);

paymentsRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  controller.getById
);

paymentsRouter.get(
  "/:id/receipt",
  validate(idParamSchema, "params"),
  controller.downloadReceipt
);

// Mounted at /memberships/:id/payments (adds to existing memberships router)
export const membershipPaymentsRouter = Router({ mergeParams: true });
membershipPaymentsRouter.get("/", controller.membershipPayments);

// Mounted at /members/:memberId/payments
export const memberPaymentsRouter = Router({ mergeParams: true });
memberPaymentsRouter.get("/", controller.memberPayments);
