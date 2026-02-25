import { ERROR_CODES } from "./errCodes";

// utils/AppError.ts
export class AppError extends Error {
  code: string;
  status?: number;
  details?: unknown; // Optional field for extra error info

  constructor(code: string, message?: string, status = 500, details?: unknown) {
    super(message || ERROR_CODES[code]?.description || "Unknown error");
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
