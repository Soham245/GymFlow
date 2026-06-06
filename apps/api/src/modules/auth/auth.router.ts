import { Router } from "express";
import { loginSchema, refreshTokenSchema, changePasswordSchema } from "@gymflow/shared";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import * as controller from "./auth.controller.js";

export const authRouter = Router();

// Public
authRouter.post("/login", validate(loginSchema), controller.loginHandler);
authRouter.post("/refresh", validate(refreshTokenSchema), controller.refreshHandler);

// Protected
authRouter.post("/logout", authenticate, validate(refreshTokenSchema), controller.logoutHandler);
authRouter.post("/logout-all", authenticate, controller.logoutAllHandler);
authRouter.get("/me", authenticate, controller.getMeHandler);
authRouter.post("/change-password", authenticate, validate(changePasswordSchema), controller.changePasswordHandler);
