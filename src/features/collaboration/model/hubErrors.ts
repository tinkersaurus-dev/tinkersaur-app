/**
 * Error codes from CollaborationHub.
 * Mirrors HubErrorCode enum in C#.
 */
export const HubErrorCode = {
  // Authentication errors (1xx)
  UserNotAuthenticated: 'UserNotAuthenticated',
  UserClaimsInvalid: 'UserClaimsInvalid',

  // Context errors (2xx)
  ContextNotJoined: 'ContextNotJoined',

  // Authorization errors (3xx)
  NotFacilitator: 'NotFacilitator',

  // Resource validation errors (4xx)
  StoryNotFound: 'StoryNotFound',
  SessionNotFound: 'SessionNotFound',
} as const;

export type HubErrorCode = (typeof HubErrorCode)[keyof typeof HubErrorCode];

/**
 * Structured error from CollaborationHub
 */
export interface HubError {
  code: HubErrorCode | string;
  message: string;
}

/**
 * Parse a SignalR error message into a structured HubError.
 * Falls back to generic error if parsing fails.
 */
export function parseHubError(error: unknown): HubError {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { code?: string; message?: string };
      if (parsed.code && parsed.message) {
        return {
          code: parsed.code as HubErrorCode,
          message: parsed.message,
        };
      }
    } catch {
      // Not a JSON error, fall through
    }
    return { code: 'Unknown', message: error.message };
  }
  return { code: 'Unknown', message: 'An unexpected error occurred' };
}

/**
 * Check if an error is a specific hub error code
 */
export function isHubErrorCode(error: unknown, code: HubErrorCode): boolean {
  const parsed = parseHubError(error);
  return parsed.code === code;
}

/**
 * Get user-friendly message for common error codes
 */
export function getHubErrorMessage(error: HubError): string {
  switch (error.code) {
    case HubErrorCode.UserNotAuthenticated:
      return 'Please sign in to continue';
    case HubErrorCode.UserClaimsInvalid:
      return 'Your session has expired. Please sign in again';
    case HubErrorCode.ContextNotJoined:
      return 'Please wait for the connection to establish';
    case HubErrorCode.NotFacilitator:
      return 'Only the session facilitator can perform this action';
    case HubErrorCode.StoryNotFound:
      return 'This story no longer exists';
    case HubErrorCode.SessionNotFound:
      return 'This pointing session has ended';
    default:
      return error.message;
  }
}
