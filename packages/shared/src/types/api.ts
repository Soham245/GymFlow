export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiError;

export interface JwtPayload {
  userId: string;
  gymId: string;
  role: string;
  email: string;
}
