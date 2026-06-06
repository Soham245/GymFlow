import { Router } from "express";
import {
  createMemberSchema,
  updateMemberSchema,
  changeStatusSchema,
  listMembersSchema,
  createMemberNoteSchema,
  idParamSchema,
} from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authorize } from "../../middleware/authorize.js";
import * as controller from "./members.controller.js";

export const membersRouter = Router();

membersRouter.get(
  "/",
  validate(listMembersSchema, "query"),
  controller.list
);

membersRouter.post(
  "/",
  authorize("owner", "receptionist"),
  validate(createMemberSchema),
  controller.create
);

membersRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  controller.getById
);

membersRouter.patch(
  "/:id",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(updateMemberSchema),
  controller.update
);

membersRouter.patch(
  "/:id/status",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(changeStatusSchema),
  controller.changeStatus
);

membersRouter.post(
  "/:id/notes",
  authorize("owner", "receptionist"),
  validate(idParamSchema, "params"),
  validate(createMemberNoteSchema),
  controller.addNote
);

membersRouter.get(
  "/:id/notes",
  validate(idParamSchema, "params"),
  controller.listNotes
);

membersRouter.delete(
  "/:id/notes/:noteId",
  authorize("owner", "receptionist"),
  controller.deleteNote
);
