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
  WORKSHOP_APPLICATION_LOCKED:
    'Workshop details cannot be changed while the application is under review or approved',
  WORKING_HOURS_INVALID: 'closes_at must be after opens_at on every open day',
  WORKSHOP_DOCUMENT_UNKNOWN:
    'documents has a key this application does not ask for',
  WORKSHOP_DOCUMENT_IMAGE_COUNT:
    'A document has fewer or more photos than it allows',

  // validation messages, reported by AppValidationPipe as "Invalid fields: …"
  PHONE_NO_FORMAT: 'phone_no must be in E.164 format, e.g. +919876543210',
  OTP_FORMAT: 'otp must be a number',
  VEHICLE_NO_FORMAT:
    'vehicle_number must be a valid registration number, e.g. MH12AB1234',
  DOCUMENTS_FORMAT:
    'documents must map each key to a list of distinct uploaded image ids',
  GST_NO_FORMAT: 'gst_no must be a valid GSTIN, e.g. 08ABCDE1234F1Z5',
  WORKING_HOURS_TIME_FORMAT:
    'opens_at and closes_at must be in 24-hour HH:mm format, e.g. 09:00',
} as const;
