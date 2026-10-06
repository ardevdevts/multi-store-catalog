import { TRPCError } from "@trpc/server";

/**
 * Standardized error codes for the application.
 * These codes are language-agnostic and should be mapped to user-facing messages on the frontend.
 */
export const ErrorCode = {
  // Database Errors
  SLUG_ALREADY_EXISTS: "SLUG_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  FOREIGN_KEY_CONSTRAINT: "FOREIGN_KEY_CONSTRAINT",
  ITEM_NOT_FOUND: "ITEM_NOT_FOUND",
  RESOURCE_IN_USE: "RESOURCE_IN_USE",

  // Validation Errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",

  // Authorization Errors
  PERMISSION_DENIED: "PERMISSION_DENIED",
  CANNOT_MODIFY_SELF: "CANNOT_MODIFY_SELF",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_EXPIRED: "AUTH_EXPIRED",

  // Business Logic Errors
  INVALID_STATE: "INVALID_STATE",
  OPERATION_FAILED: "OPERATION_FAILED",

  // Network/System Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Maps Prisma error codes to our standardized error codes
 */
export function mapPrismaError(error: any): ErrorCodeType | null {
  if (!error?.code) return null;

  switch (error.code) {
    case "P2002": // Unique constraint violation
      // Check which field is violating the constraint
      const target = error.meta?.target;
      if (target?.includes("email")) {
        return ErrorCode.EMAIL_ALREADY_EXISTS;
      }
      if (target?.includes("slug")) {
        return ErrorCode.SLUG_ALREADY_EXISTS;
      }
      return ErrorCode.SLUG_ALREADY_EXISTS; // Default assumption

    case "P2003": // Foreign key constraint violation
      return ErrorCode.FOREIGN_KEY_CONSTRAINT;

    case "P2025": // Record not found
      return ErrorCode.ITEM_NOT_FOUND;

    default:
      return null;
  }
}

/**
 * Creates a TRPCError with a standardized error code
 */
export function createErrorWithCode(
  code: ErrorCodeType,
  options?: {
    message?: string;
    trpcCode?: TRPCError["code"];
    details?: Record<string, any>;
  },
): TRPCError {
  const { message, trpcCode, details } = options || {};

  // Map error codes to appropriate tRPC codes
  let defaultTrpcCode: TRPCError["code"] = "INTERNAL_SERVER_ERROR";

  if (code === ErrorCode.ITEM_NOT_FOUND) {
    defaultTrpcCode = "NOT_FOUND";
  } else if (
    code === ErrorCode.SLUG_ALREADY_EXISTS ||
    code === ErrorCode.EMAIL_ALREADY_EXISTS ||
    code === ErrorCode.FOREIGN_KEY_CONSTRAINT ||
    code === ErrorCode.RESOURCE_IN_USE ||
    code === ErrorCode.INVALID_INPUT ||
    code === ErrorCode.MISSING_REQUIRED_FIELD ||
    code === ErrorCode.INVALID_FILE_TYPE ||
    code === ErrorCode.FILE_TOO_LARGE ||
    code === ErrorCode.INVALID_STATE
  ) {
    defaultTrpcCode = "BAD_REQUEST";
  } else if (
    code === ErrorCode.PERMISSION_DENIED ||
    code === ErrorCode.CANNOT_MODIFY_SELF ||
    code === ErrorCode.AUTH_REQUIRED ||
    code === ErrorCode.AUTH_EXPIRED
  ) {
    defaultTrpcCode = "UNAUTHORIZED";
  }

  return new TRPCError({
    code: trpcCode || defaultTrpcCode,
    message: message || code,
    cause: {
      code,
      ...details,
    },
  });
}
