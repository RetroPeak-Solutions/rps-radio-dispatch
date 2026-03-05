export type ErrorCodeInfo = {
  title: string;
  description: string;
};

// Canonical custom error codes used across web + dispatch (front/back).
export const ERROR_CODES: Record<string, ErrorCodeInfo> = {
  INTERNAL_ERROR: {
    title: "Unexpected Error",
    description:
      "An unexpected error occurred. Please try again later. If this continues, contact support.",
  },
  BAD_REQUEST: {
    title: "Bad Request",
    description: "The request payload or parameters are invalid.",
  },
  UNAUTHORIZED: {
    title: "Unauthorized",
    description: "You must sign in to continue.",
  },
  FORBIDDEN: {
    title: "Access Denied",
    description: "You do not have permission to access this resource.",
  },
  NOT_FOUND: {
    title: "Not Found",
    description: "The requested resource could not be found.",
  },
  VALIDATION_ERROR: {
    title: "Validation Error",
    description: "One or more fields are invalid. Review your input and try again.",
  },
  NETWORK_ERROR: {
    title: "Network Error",
    description: "The app could not reach the server. Check your connection and try again.",
  },
  SOCKET_ERROR: {
    title: "Realtime Connection Error",
    description:
      "The realtime connection encountered an error. The app will retry automatically.",
  },

  AUTH_INVALID_TOKEN: {
    title: "Invalid Token",
    description: "Your authentication token is invalid or expired. Please sign in again.",
  },
  AUTH_TOKEN_EXPIRED: {
    title: "Session Expired",
    description: "Your session expired. Please sign in again.",
  },
  EMAIL_UNVERIFIED: {
    title: "Email Not Verified",
    description: "You must verify your email before accessing this feature.",
  },

  SYSTEM_BANNED: {
    title: "Account Banned",
    description:
      "This account is currently banned from the system. Contact support if you believe this is a mistake.",
  },
  DEVICE_BANNED: {
    title: "Device Banned",
    description:
      "This device is banned from using the dispatch system. Contact support for more information.",
  },
  COMMUNITY_BANNED: {
    title: "Community Access Revoked",
    description:
      "You are banned from this community and cannot access its dashboard or dispatch console.",
  },
};
