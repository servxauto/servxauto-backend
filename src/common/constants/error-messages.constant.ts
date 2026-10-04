/**
 * Standard human-readable default error messages used across the application.
 */
export const ErrorMessage = {
  INVALID_REQUEST: 'Invalid request',
  RECORD_NOT_FOUND: 'Record not found',
  RECORD_CONFLICT: 'Record already exists',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Permission denied',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid token or expired',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  INVALID_ID: 'Invalid UUID',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',

  // domain specific error messages
} as const;
