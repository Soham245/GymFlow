import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@gymflow/shared";
import { AppError } from "../utils/app-error.js";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role as UserRole)) {
      throw AppError.forbidden(
        `Role '${req.user.role}' cannot access this resource`
      );
    }
    next();
  };
}
