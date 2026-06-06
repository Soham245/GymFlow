export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: Record<string, string[]>) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(entity: string) {
    return new AppError(404, "NOT_FOUND", `${entity} not found`);
  }

  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }
}
