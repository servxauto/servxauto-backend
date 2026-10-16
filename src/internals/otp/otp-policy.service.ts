import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addMinutes, generateRandomCode } from '@/common/utils/common.util';

const OTP_LENGTH = 6;

/** Accepted for any identity in development, so QA does not need a real inbox. */
const DEV_BYPASS_CODE = 112233;

/**
 * The rules around a code: how long it lives, how often one may be requested,
 * how it is generated. Pure config and arithmetic — no database, no delivery —
 * so it can be reasoned about and tested on its own.
 */
@Injectable()
export class OtpPolicyService {
  constructor(private readonly configService: ConfigService) {}

  /** A fresh code of the configured length. */
  generateCode(): number {
    return generateRandomCode(OTP_LENGTH);
  }

  /** Expiry for a code issued now. */
  nextExpiresAt(): Date {
    return addMinutes(this.ttlSeconds() / 60);
  }

  /** Gap enforced between two sends, from `OTP_RESEND_COOLDOWN_S`. */
  cooldownSeconds(): number {
    return Number(this.configService.get('OTP_RESEND_COOLDOWN_S', 30));
  }

  /**
   * Seconds left on the resend cooldown for a code expiring at `expiresAt`,
   * 0 when another code may be sent.
   *
   * The send time is derived as `expires_at - OTP_TTL_S` rather than stored:
   * `created_at` is set once and the row is reused across resends, and
   * `updated_at` is also bumped by verification.
   */
  cooldownRemaining(expiresAt: Date): number {
    const sentAtMs = expiresAt.getTime() - this.ttlSeconds() * 1000;
    const elapsed = (Date.now() - sentAtMs) / 1000;
    return Math.max(0, Math.ceil(this.cooldownSeconds() - elapsed));
  }

  /** Whether `code` is the development bypass, usable only outside deployment. */
  isDevBypass(code: number): boolean {
    return (
      code === DEV_BYPASS_CODE &&
      this.configService.get('NODE_ENV') === 'development'
    );
  }

  /** Code lifetime, from `OTP_TTL_S` (seconds) in the environment. */
  private ttlSeconds(): number {
    return Number(this.configService.get('OTP_TTL_S', 300));
  }
}
