// utils/errorCodes.ts
export const ERROR_CODES: Record<string, { title: string; description: string }> = {
    PAGE_NOT_FOUND: {
        title: "Error 404",
        description: "The Requested Page has not been Found!"
    },
    MISSING_TKN_PASS: {
        title: 'Password/Token Required',
        description: 'A Token and Password Must be Provided to Continue',
    },
    INVALID_MSS_TKN: {
        title: 'Invalid Reset Token',
        description: "The Password Reset Token Provided Is Invalid/Expired Please Request a New Token to Continue!",
    },
    DSCRD_RTLMT: {
        title: "Discord RateLimit",
        description: 'Failed to load Due to Discord Rate Limits. Please Try Again later!',
    },
    TCKERR_INVALID: {
        title: "Invalid Token",
        description: "The authentication token is invalid or has expired. Please log in again."
    },
    TCKERR_FORBIDDEN: {
        title: "Forbidden",
        description: "You don’t have permission to access this resource."
    },
    TCKERR_UNKNOWN: {
        title: "Unexpected Error",
        description: `
            An unexpected error has occurred. 
            Please try again later.
            Please Contact A Developer to Report the Issue.
        `
    }
};
