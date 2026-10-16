import { User } from '@/modules/users/entities/user.entity';

export interface UserSendOtpResult {
  phone_no: string;
  /** ISO timestamp, drives the client countdown. */
  expires_at: string;
  /** Seconds before `send-otp` accepts another request. */
  resend_after_seconds: number;
}

export interface UserAuthSession {
  user: User;
  token: string;
  is_new_user: boolean;
}
