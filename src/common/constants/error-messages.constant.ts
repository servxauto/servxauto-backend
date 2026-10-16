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
  NO_TOKEN_PROVIDED: 'No token provided',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  INVALID_ID: 'Invalid UUID',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',

  // domain specific error messages
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_IN_USE: 'This email is already linked to another account',
  MEDIA_NOT_FOUND: 'Uploaded file not found',
  VEHICLE_ALREADY_ADDED: 'This vehicle is already in your garage',
  FILE_REQUIRED: 'A file is required',
  IMAGE_TYPE: 'File must be a JPEG, PNG or WebP image',
  IMAGE_TOO_LARGE: 'Image is too large',
  WORKER_NOT_FOUND: 'Worker not found',
  WORKSHOP_NOT_FOUND: 'Workshop not found',
  /** Verification failed; the code was wrong, already used, or past its TTL. */
  OTP_INVALID: 'Invalid or expired OTP',
  OTP_RESEND_TOO_SOON: 'Please wait before requesting another OTP',
  WORKSHOP_APPLICATION_NOT_FOUND: 'Workshop application not found',
  WORKSHOP_APPLICATION_INCOMPLETE:
    'Complete every onboarding step before submitting',
  WORKSHOP_APPLICATION_ALREADY_SUBMITTED:
    'This application has already been submitted and is awaiting review',
  WORKSHOP_APPLICATION_ALREADY_APPROVED:
    'This application has already been approved',

  // validation messages, reported by AppValidationPipe as "Invalid fields: …"
  PHONE_NO_FORMAT: 'phone_no must be in E.164 format, e.g. +919876543210',
  OTP_FORMAT: 'otp must be a number',
  VEHICLE_NO_FORMAT:
    'vehicle_number must be a valid registration number, e.g. MH12AB1234',
} as const;
