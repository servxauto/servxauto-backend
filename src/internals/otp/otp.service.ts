import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { OtpPolicyService } from './otp-policy.service';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { TooManyRequestsException } from '@/core/exceptions/app-http.exception';
import { MailService } from '../mail/mail.service';
import { SmsService } from '@/common/services/sms.service';

/** Which identity an OTP is keyed on. */
type OtpChannel = 'email' | 'phone';

/** What the caller needs to drive an OTP entry screen. */
export interface OtpIssueResult {
  /** When the issued code stops being accepted. */
  expires_at: Date;
  /** Seconds the caller must wait before another code can be requested. */
  resend_after_seconds: number;
}

/**
 * Issues and verifies one-time codes against the `otps` table.
 *
 * The rules live in OtpPolicyService and delivery in MailService/SmsService;
 * what is left here is the orchestration and the persistence.
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    private readonly policy: OtpPolicyService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Issues a code for `email` and queues the OTP mail. `username` is only used
   * to address the template; it falls back to the address itself.
   */
  async sendEmailOtp(
    email: string,
    username?: string,
  ): Promise<OtpIssueResult> {
    const otp = await this.issue('email', email);
    await this.mailService.sendOtpMail(email, {
      code: otp.code,
      username: username ?? email,
    });
    return this.toIssueResult(otp);
  }

  /** True when `code` is the pending, unexpired code for `email`. */
  async verifyEmailOtp(email: string, code: number): Promise<boolean> {
    if (this.policy.isDevBypass(code)) {
      return true;
    }
    return this.consume('email', email, code);
  }

  /** Issues a code for `phone` and hands it to the SMS channel. */
  async sendPhoneOtp(phone: string): Promise<OtpIssueResult> {
    const otp = await this.issue('phone', phone);
    await this.smsService.sendOtp(phone, otp.code);
    return this.toIssueResult(otp);
  }

  /** True when `code` is the pending, unexpired code for `phone`. */
  async verifyPhoneOtp(phone: string, code: number): Promise<boolean> {
    if (this.policy.isDevBypass(code)) {
      return true;
    }
    return this.consume('phone', phone, code);
  }

  /**
   * Creates or replaces the pending code for an identity, so only the most
   * recent code ever works.
   */
  private async issue(channel: OtpChannel, value: string): Promise<Otp> {
    const existing = await this.otpRepo.findOne({
      where: this.identity(channel, value),
    });

    if (existing && this.policy.cooldownRemaining(existing.expires_at) > 0) {
      throw new TooManyRequestsException(
        ErrorMessage.OTP_RESEND_TOO_SOON,
        ErrorCode.OTP_RESEND_TOO_SOON,
      );
    }

    const otp =
      existing ??
      this.otpRepo.create(
        channel === 'email'
          ? { email: value, phone: null }
          : { phone: value, email: null },
      );

    otp.code = this.policy.generateCode();
    otp.is_verified = false;
    otp.expires_at = this.policy.nextExpiresAt();

    return this.otpRepo.save(otp);
  }

  /** Marks the matching code verified. Returns false when nothing matches. */
  private async consume(
    channel: OtpChannel,
    value: string,
    code: number,
  ): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: {
        ...this.identity(channel, value),
        code,
        is_verified: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!otp) {
      return false;
    }
    otp.is_verified = true;
    await this.otpRepo.save(otp);
    return true;
  }

  private identity(
    channel: OtpChannel,
    value: string,
  ): { email: string } | { phone: string } {
    return channel === 'email' ? { email: value } : { phone: value };
  }

  private toIssueResult(otp: Otp): OtpIssueResult {
    return {
      expires_at: otp.expires_at,
      resend_after_seconds: this.policy.cooldownSeconds(),
    };
  }
}
