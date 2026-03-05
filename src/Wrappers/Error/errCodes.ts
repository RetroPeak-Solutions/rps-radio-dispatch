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

  PAYMENT_PROVIDER_ERROR: {
    title: "Payment Provider Error",
    description: "The payment provider could not process the request. Please try again.",
  },
  PAYMENT_METHOD_REQUIRED: {
    title: "Payment Method Required",
    description: "A valid payment method is required to complete this action.",
  },
  PAYMENT_METHOD_INVALID: {
    title: "Invalid Payment Method",
    description: "The selected payment method is invalid or no longer available.",
  },
  PAYMENT_FAILED: {
    title: "Payment Failed",
    description: "The payment could not be completed. Try another method or try again later.",
  },
  INVOICE_NOT_FOUND: {
    title: "Invoice Not Found",
    description: "The requested invoice was not found.",
  },
  INVOICE_NOT_PAYABLE: {
    title: "Invoice Not Payable",
    description: "This invoice cannot be paid in its current state.",
  },
  SUBSCRIPTION_NOT_FOUND: {
    title: "Subscription Not Found",
    description: "No active subscription was found for this request.",
  },
  SUBSCRIPTION_CHANGE_FAILED: {
    title: "Plan Change Failed",
    description: "The subscription plan change could not be completed.",
  },
  SUBSCRIPTION_CANCEL_FAILED: {
    title: "Cancellation Failed",
    description: "The subscription could not be canceled at this time.",
  },
  SUBSCRIPTION_RESUME_FAILED: {
    title: "Resume Failed",
    description: "The subscription could not be resumed at this time.",
  },
  DISCOUNT_CODE_INVALID: {
    title: "Invalid Discount Code",
    description: "That discount code is invalid, expired, or not applicable.",
  },
  DISCOUNT_CODE_ALREADY_USED: {
    title: "Discount Already Used",
    description: "That discount code has already been used for this eligibility scope.",
  },
  REFUND_NOT_ALLOWED: {
    title: "Refund Not Allowed",
    description: "A refund is not allowed for this subscription action.",
  },
  REFUND_FAILED: {
    title: "Refund Failed",
    description: "The refund could not be processed. Please try again later.",
  },

  COMMUNITY_NOT_FOUND: {
    title: "Community Not Found",
    description: "The selected community could not be found.",
  },
  COMMUNITY_UPDATE_FAILED: {
    title: "Community Update Failed",
    description: "The community settings could not be updated.",
  },
  COMMUNITY_PERMISSION_DENIED: {
    title: "Community Permission Denied",
    description: "You do not have permission to perform this action in this community.",
  },
  COMMUNITY_PLAN_LIMIT_REACHED: {
    title: "Plan Limit Reached",
    description: "This action exceeds your current community plan limits.",
  },

  ACCOUNT_UPDATE_FAILED: {
    title: "Account Update Failed",
    description: "Your account information could not be updated.",
  },
  PROFILE_UPDATE_FAILED: {
    title: "Profile Update Failed",
    description: "Your profile changes could not be saved.",
  },
  PASSWORD_UPDATE_FAILED: {
    title: "Password Update Failed",
    description: "Your password could not be updated.",
  },
  ADDRESS_UPDATE_FAILED: {
    title: "Address Update Failed",
    description: "Your billing or address information could not be updated.",
  },

  SESSION_INVALID: {
    title: "Invalid Session",
    description: "Your session is invalid. Please sign in again.",
  },
  SESSION_EXPIRED: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again.",
  },
  DEVICE_REGISTRATION_FAILED: {
    title: "Device Registration Failed",
    description: "The dispatch device could not be registered for this session.",
  },
  DISPATCH_SESSION_FAILED: {
    title: "Dispatch Session Error",
    description: "The dispatch session could not be established or refreshed.",
  },

  AUTH_LOGIN_FAILED: {
    title: "Login Failed",
    description: "The provided credentials are invalid.",
  },
  AUTH_REGISTER_FAILED: {
    title: "Registration Failed",
    description: "Your account could not be created. Please try again.",
  },
  AUTH_ACCOUNT_LOCKED: {
    title: "Account Locked",
    description: "This account is temporarily locked due to repeated failed sign-in attempts.",
  },
  AUTH_MFA_REQUIRED: {
    title: "Verification Required",
    description: "Multi-factor verification is required to continue.",
  },
  AUTH_MFA_INVALID: {
    title: "Invalid Verification Code",
    description: "The multi-factor verification code is invalid or expired.",
  },
  AUTH_PASSWORD_RESET_REQUIRED: {
    title: "Password Reset Required",
    description: "You must reset your password before continuing.",
  },

  RATE_LIMITED: {
    title: "Too Many Requests",
    description: "Too many requests were made. Please wait and try again.",
  },
  REQUEST_TIMEOUT: {
    title: "Request Timed Out",
    description: "The request took too long to complete. Please try again.",
  },
  SERVICE_UNAVAILABLE: {
    title: "Service Unavailable",
    description: "This service is temporarily unavailable. Please try again later.",
  },
  MAINTENANCE_MODE: {
    title: "Maintenance Mode",
    description: "The platform is currently in maintenance mode.",
  },

  FILE_UPLOAD_FAILED: {
    title: "Upload Failed",
    description: "The file upload failed. Please try again.",
  },
  FILE_TOO_LARGE: {
    title: "File Too Large",
    description: "The selected file exceeds the allowed size limit.",
  },
  FILE_TYPE_NOT_ALLOWED: {
    title: "File Type Not Allowed",
    description: "This file type is not allowed.",
  },
  MEDIA_PROCESSING_FAILED: {
    title: "Media Processing Failed",
    description: "The media file could not be processed.",
  },
  AUDIO_DECODE_FAILED: {
    title: "Audio Decode Failed",
    description: "The audio stream could not be decoded.",
  },
  AUDIO_PLAYBACK_FAILED: {
    title: "Audio Playback Failed",
    description: "Audio could not be played on the selected output device.",
  },
  AUDIO_DEVICE_NOT_FOUND: {
    title: "Audio Device Not Found",
    description: "The selected input/output device is unavailable.",
  },

  CODEPLUG_NOT_FOUND: {
    title: "Codeplug Not Found",
    description: "The requested codeplug could not be found.",
  },
  CODEPLUG_INVALID_SCHEMA: {
    title: "Invalid Codeplug Schema",
    description: "The codeplug JSON does not match the required schema.",
  },
  CODEPLUG_EXPORT_FAILED: {
    title: "Codeplug Export Failed",
    description: "The codeplug could not be exported.",
  },
  CODEPLUG_IMPORT_FAILED: {
    title: "Codeplug Import Failed",
    description: "The codeplug file could not be imported.",
  },
  CODEPLUG_SAVE_FAILED: {
    title: "Codeplug Save Failed",
    description: "Codeplug changes could not be saved.",
  },

  RADIO_ZONE_NOT_FOUND: {
    title: "Radio Zone Not Found",
    description: "The selected radio zone could not be found.",
  },
  RADIO_CHANNEL_NOT_FOUND: {
    title: "Radio Channel Not Found",
    description: "The selected radio channel could not be found.",
  },
  RADIO_CHANNEL_BUSY: {
    title: "Channel Busy",
    description: "Another user is already transmitting on this channel.",
  },
  RADIO_CHANNEL_LOCK_FAILED: {
    title: "Channel Lock Failed",
    description: "The channel could not be locked for transmission.",
  },
  RADIO_TONE_SEND_FAILED: {
    title: "Tone Transmission Failed",
    description: "The tone packet could not be transmitted.",
  },
  RADIO_VOICE_SEND_FAILED: {
    title: "Voice Transmission Failed",
    description: "Voice audio could not be transmitted.",
  },
  RADIO_PTT_DENIED: {
    title: "PTT Denied",
    description: "Push-to-talk was denied for this action.",
  },
  RADIO_PTT_STUCK: {
    title: "PTT State Error",
    description: "PTT state became inconsistent and was reset.",
  },

  CALL_HISTORY_NOT_FOUND: {
    title: "Call History Not Found",
    description: "No call history items were found for this filter.",
  },
  CALL_HISTORY_FETCH_FAILED: {
    title: "Call History Fetch Failed",
    description: "Call history could not be loaded.",
  },
  RECORDING_NOT_FOUND: {
    title: "Recording Not Found",
    description: "The requested recording could not be found.",
  },
  RECORDING_SAVE_FAILED: {
    title: "Recording Save Failed",
    description: "The transmission recording could not be saved.",
  },
  RECORDING_PLAYBACK_FAILED: {
    title: "Recording Playback Failed",
    description: "The recording could not be played.",
  },

  BAN_CREATE_FAILED: {
    title: "Ban Failed",
    description: "The ban action could not be completed.",
  },
  BAN_REMOVE_FAILED: {
    title: "Unban Failed",
    description: "The unban action could not be completed.",
  },
  BAN_ALREADY_ACTIVE: {
    title: "Ban Already Active",
    description: "An active ban already exists for this target.",
  },
  BAN_NOT_FOUND: {
    title: "Ban Not Found",
    description: "No active ban was found for this target.",
  },
  PERMISSION_DENIED: {
    title: "Permission Denied",
    description: "You do not have required permissions for this operation.",
  },

  STRIPE_CONFIG_MISSING: {
    title: "Billing Configuration Error",
    description: "Billing provider configuration is missing or invalid.",
  },
  STRIPE_CUSTOMER_NOT_FOUND: {
    title: "Customer Not Found",
    description: "No billing customer record exists for this account.",
  },
  STRIPE_SUBSCRIPTION_NOT_FOUND: {
    title: "Stripe Subscription Not Found",
    description: "The Stripe subscription could not be found.",
  },
  STRIPE_INVOICE_FINALIZE_FAILED: {
    title: "Invoice Finalization Failed",
    description: "The invoice could not be finalized for payment.",
  },
  STRIPE_INVOICE_PAY_FAILED: {
    title: "Invoice Payment Failed",
    description: "Stripe could not process the invoice payment.",
  },
  STRIPE_WEBHOOK_FAILED: {
    title: "Webhook Processing Failed",
    description: "A Stripe webhook event could not be processed.",
  },

  COMMUNITY_CREATE_FAILED: {
    title: "Community Creation Failed",
    description: "The community could not be created.",
  },
  COMMUNITY_DELETE_FAILED: {
    title: "Community Deletion Failed",
    description: "The community could not be deleted.",
  },
  COMMUNITY_MEMBER_NOT_FOUND: {
    title: "Community Member Not Found",
    description: "The selected member was not found in this community.",
  },
  COMMUNITY_MEMBER_UPDATE_FAILED: {
    title: "Member Update Failed",
    description: "The community member record could not be updated.",
  },
  COMMUNITY_ROLE_UPDATE_FAILED: {
    title: "Role Update Failed",
    description: "The community role assignment could not be updated.",
  },

  DISPATCH_DEVICE_NOT_FOUND: {
    title: "Dispatch Device Not Found",
    description: "No dispatch device record exists for this target.",
  },
  DISPATCH_DEVICE_UPDATE_FAILED: {
    title: "Dispatch Device Update Failed",
    description: "The dispatch device could not be updated.",
  },
  DISPATCH_KEYBIND_INVALID: {
    title: "Invalid Keybind",
    description: "The configured keybind is invalid or conflicts with another bind.",
  },
  DISPATCH_LAYOUT_SAVE_FAILED: {
    title: "Layout Save Failed",
    description: "Console layout positions could not be saved.",
  },
  DISPATCH_SETTINGS_SAVE_FAILED: {
    title: "Settings Save Failed",
    description: "Dispatch settings could not be saved.",
  },

  INTEGRATION_FAILED: {
    title: "Integration Error",
    description: "An external integration failed to complete the request.",
  },
  GITHUB_RELEASE_FETCH_FAILED: {
    title: "Release Fetch Failed",
    description: "App release information could not be loaded from GitHub.",
  },
  UPDATE_CHECK_FAILED: {
    title: "Update Check Failed",
    description: "Unable to check for app updates.",
  },
  UPDATE_DOWNLOAD_FAILED: {
    title: "Update Download Failed",
    description: "The update package could not be downloaded.",
  },
  UPDATE_INSTALL_FAILED: {
    title: "Update Install Failed",
    description: "The update could not be installed.",
  },

  DATABASE_ERROR: {
    title: "Database Error",
    description: "A database operation failed.",
  },
  DATABASE_CONSTRAINT_ERROR: {
    title: "Database Constraint Error",
    description: "The operation violates a database constraint.",
  },
  MIGRATION_ERROR: {
    title: "Migration Error",
    description: "A database migration could not be applied.",
  },
  CONFIG_MISSING: {
    title: "Configuration Missing",
    description: "A required server or app configuration value is missing.",
  },
  CONFIG_INVALID: {
    title: "Configuration Invalid",
    description: "A configuration value is invalid.",
  },
};

export type ErrorCode = keyof typeof ERROR_CODES;
