import { Workshop } from '@/modules/workshops/entities/workshop.entity';

export interface WorkshopSendOtpResult {
  phone_no: string;
  /** ISO timestamp, drives the client countdown. */
  expires_at: string;
  /** Seconds before `send-otp` accepts another request. */
  resend_after_seconds: number;
}

export interface WorkshopAuthSession {
  workshop: Workshop;
  token: string;
  is_new_user: boolean;
}
