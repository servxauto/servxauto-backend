/**
 * Standard machine-readable error codes / reason identifiers for client-side handling.
 */
export const ErrorCode = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  RECORD_CONFLICT: 'RECORD_CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  // domain specific error codes
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
