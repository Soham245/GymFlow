import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/app-error.js";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request & { validatedQuery?: unknown }, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key]!.push(issue.message);
      }
      throw AppError.badRequest("Validation failed", fieldErrors);
    }
    if (target === "body") {
      req.body = result.data;
    } else if (target === "query") {
      req.validatedQuery = result.data;
    }
    next();
  };
}
