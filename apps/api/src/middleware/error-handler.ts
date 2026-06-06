import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/response.js";
import { logger } from "../config/logger.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, url: req.url, method: req.method }, "Server error");
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Zod validation errors that escaped the validate middleware
  if (err.name === "ZodError") {
    sendError(res, 400, "VALIDATION_ERROR", "Invalid request data");
    return;
  }

  // JSON parse errors
  if (err.type === "entity.parse.failed") {
    sendError(res, 400, "PARSE_ERROR", "Invalid JSON in request body");
    return;
  }

  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      url: req.url,
      method: req.method,
    },
    "Unhandled error"
  );

  sendError(res, 500, "INTERNAL_ERROR", "Something went wrong");
}
