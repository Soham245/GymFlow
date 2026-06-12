import { Router } from "express";
import { listNotificationsSchema, idParamSchema } from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  validate(listNotificationsSchema, "query"),
  controller.list
);

notificationsRouter.get("/unread-count", controller.unreadCount);

notificationsRouter.patch(
  "/read-all",
  controller.markAllRead
);

notificationsRouter.patch(
  "/:id/read",
  validate(idParamSchema, "params"),
  controller.markRead
);

notificationsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  controller.remove
);

notificationsRouter.post(
  "/run-automation",
  authorize("owner"),
  controller.runAutomation
);
