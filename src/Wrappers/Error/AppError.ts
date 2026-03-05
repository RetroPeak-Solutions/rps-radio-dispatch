import { ERROR_CODES, type ErrorCode } from "@wrappers/Error/errCodes";

// utils/AppError.ts
export class AppError extends Error {
  code: ErrorCode;
  status?: number;
  details?: unknown; // Optional field for extra error info

  constructor(code: ErrorCode, message?: string, status = 500, details?: unknown) {
    super(message || ERROR_CODES[code]?.description || "Unknown error");
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
