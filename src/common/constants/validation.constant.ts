/** E.164 phone number, e.g. `+919876543210`. */
export const PHONE_NO_REGEX = /^\+[1-9]\d{7,14}$/;

/** Indian GSTIN, uppercase, e.g. `08ABCDE1234F1Z5`. */
export const GST_NO_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** 24-hour `HH:mm`, e.g. `09:00` or `20:30`. */
export const TIME_HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
