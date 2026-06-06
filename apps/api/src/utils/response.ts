import type { Response } from "express";
import type { ApiResponse, ApiError } from "@gymflow/shared";

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ApiResponse["meta"],
  statusCode = 200
) {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>
) {
  const body: ApiError = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  res.status(statusCode).json(body);
}
