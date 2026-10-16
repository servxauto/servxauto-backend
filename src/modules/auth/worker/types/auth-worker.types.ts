import { Worker } from '@/modules/workers/entities/worker.entity';

export interface WorkerSendOtpResult {
  phone_no: string;
  /** ISO timestamp, drives the client countdown. */
  expires_at: string;
  /** Seconds before `send-otp` accepts another request. */
  resend_after_seconds: number;
}

export interface WorkerAuthSession {
  worker: Worker;
  token: string;
  is_new_user: boolean;
}
