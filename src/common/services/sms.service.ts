import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Outbound SMS. The counterpart to MailService — callers hand it something to
 * deliver and do not care how.
 *
 * No provider is wired up yet: outside production the code is logged so local
 * development needs no SMS account, and in production delivery is a no-op that
 * warns loudly rather than pretending to have sent.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Delivers a verification code to `phone`. */
  async sendOtp(phone: string, code: number): Promise<void> {
    if (!this.isProduction()) {
      this.logger.debug(`OTP for ${phone}: ${code}`);
      return;
    }

    // TODO: hand `code` to an SMS provider here once one is chosen. Keep it
    // out of the logs below — production logs should not carry live codes.
    await Promise.resolve();

    this.logger.warn(
      `No SMS provider configured; OTP for ${phone} was not delivered`,
    );
  }

  private isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }
}
