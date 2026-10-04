import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ErrorCode,
  ErrorCodeType,
} from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { AppHttpError } from '@/common/types/error.types';

/**
 * Base exception class for application-level HTTP errors.
 * Formats response payloads into `{ status_code, message, error_code }`.
 *
 * Every subclass accepts an optional domain-specific `code` (defaults to the
 * generic one for its status) and an optional `cause` — the original error,
 * kept for logging and debugging but never sent to the client.
 *
 * @example
 * throw new InvalidRequestException('Slot already booked', ErrorCode.SLOT_UNAVAILABLE);
 * throw new RecordConflictException('Email already registered', undefined, dbError);
 */
export abstract class AppHttpException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    message: string,
    errorCode: ErrorCodeType,
    cause?: unknown,
  ) {
    const body: AppHttpError = {
      status_code: statusCode,
      message,
      error_code: errorCode,
    };
    super(body, statusCode, { cause });
  }
}

/**
 * Thrown when a request contains invalid parameters, payload validation fails, or file size/type constraints are violated (HTTP 400).
 */
export class InvalidRequestException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.INVALID_REQUEST,
    errorCode: ErrorCodeType = ErrorCode.INVALID_REQUEST,
    cause?: unknown,
  ) {
    super(HttpStatus.BAD_REQUEST, message, errorCode, cause);
  }
}

/**
 * Thrown when authentication fails or is missing (e.g., missing credentials, invalid OTP) (HTTP 401).
 */
export class AppUnauthorizedException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.UNAUTHORIZED,
    errorCode: ErrorCodeType = ErrorCode.UNAUTHORIZED,
    cause?: unknown,
  ) {
    super(HttpStatus.UNAUTHORIZED, message, errorCode, cause);
  }
}

/**
 * Thrown when a provided JWT or authentication token is invalid or expired (HTTP 401).
 */
export class InvalidOrExpiredTokenException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.INVALID_OR_EXPIRED_TOKEN,
    errorCode: ErrorCodeType = ErrorCode.INVALID_OR_EXPIRED_TOKEN,
    cause?: unknown,
  ) {
    super(HttpStatus.UNAUTHORIZED, message, errorCode, cause);
  }
}

/**
 * Thrown when an authenticated user does not have permission or role access, or when an account is inactive (HTTP 403).
 */
export class AppForbiddenException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.FORBIDDEN,
    errorCode: ErrorCodeType = ErrorCode.FORBIDDEN,
    cause?: unknown,
  ) {
    super(HttpStatus.FORBIDDEN, message, errorCode, cause);
  }
}

/**
 * Thrown when a requested record is not found (HTTP 404).
 */
export class RecordNotFoundException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.RECORD_NOT_FOUND,
    errorCode: ErrorCodeType = ErrorCode.RECORD_NOT_FOUND,
    cause?: unknown,
  ) {
    super(HttpStatus.NOT_FOUND, message, errorCode, cause);
  }
}

/**
 * Thrown when an entity conflict occurs, such as duplicate emails, slugs, or unique constraints (HTTP 409).
 */
export class RecordConflictException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.RECORD_CONFLICT,
    errorCode: ErrorCodeType = ErrorCode.RECORD_CONFLICT,
    cause?: unknown,
  ) {
    super(HttpStatus.CONFLICT, message, errorCode, cause);
  }
}

/**
 * Thrown when a client exceeds a rate limit, e.g. too many OTP requests (HTTP 429).
 * Global request throttling is handled by ThrottlerGuard, which reports the same code.
 */
export class TooManyRequestsException extends AppHttpException {
  constructor(
    message: string = ErrorMessage.TOO_MANY_REQUESTS,
    errorCode: ErrorCodeType = ErrorCode.TOO_MANY_REQUESTS,
    cause?: unknown,
  ) {
    super(HttpStatus.TOO_MANY_REQUESTS, message, errorCode, cause);
  }
}
