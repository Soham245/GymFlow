import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@gymflow/shared";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      gymId?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or invalid Authorization header");
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (!payload.userId || !payload.gymId || !payload.role) {
      throw AppError.unauthorized("Malformed token payload");
    }

    req.user = payload;
    req.gymId = payload.gymId;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(AppError.unauthorized("Invalid or expired token"));
    }
  }
}
