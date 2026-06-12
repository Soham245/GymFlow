import { Router } from "express";
import {
  createMembershipSchema,
  renewMembershipSchema,
  freezeMembershipSchema,
  unfreezeMembershipSchema,
  idParamSchema,
} from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./memberships.controller.js";

// Mounted at /memberships
export const membershipsRouter = Router();

membershipsRouter.get(
  "/",
  controller.listAll
);

// Batch delete MUST be above /:id routes
membershipsRouter.post(
  "/batch-delete",
  authorize("owner"),
  controller.batchDelete
);

membershipsRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  controller.getById
);

membershipsRouter.post(
  "/:id/renew",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(renewMembershipSchema),
  controller.renew
);

membershipsRouter.post(
  "/:id/freeze",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(freezeMembershipSchema),
  controller.freeze
);

membershipsRouter.post(
  "/:id/unfreeze",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(unfreezeMembershipSchema),
  controller.unfreeze
);

// Mounted at /members/:memberId/memberships
export const memberMembershipsRouter = Router({ mergeParams: true });

memberMembershipsRouter.post(
  "/",
  authorize("owner", "receptionist"),
  validate(createMembershipSchema),
  controller.create
);

memberMembershipsRouter.get("/", controller.listForMember);
