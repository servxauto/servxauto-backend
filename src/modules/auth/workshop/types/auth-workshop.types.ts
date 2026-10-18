import type { WorkshopApplication } from '@/modules/workshops/entities/workshop-application.entity';
import type { WorkshopView } from '@/modules/workshops/types/workshops.types';

export interface WorkshopSendOtpResult {
  phone_no: string;
  /** ISO timestamp, drives the client countdown. */
  expires_at: string;
  /** Seconds before `send-otp` accepts another request. */
  resend_after_seconds: number;
}

export interface WorkshopAuthSession {
  /** Everything entered so far on every onboarding screen, as `GET workshops/me` returns it. */
  workshop: WorkshopView;
  /** Step progress and review status, as `GET workshops/me/application` returns it. */
  application: WorkshopApplication;
  token: string;
  is_new_user: boolean;
}
