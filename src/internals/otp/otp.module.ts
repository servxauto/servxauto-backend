import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpPolicyService } from './otp-policy.service';
import { OtpService } from './otp.service';
import { MailModule } from '../mail/mail.module';

/**
 * OtpService requires MailService, so MailModule is imported here. MailModule
 * registers a Bull queue, which means the app needs Redis reachable at
 * REDIS_URL to boot — even for the phone-only auth endpoints.
 *
 * OtpPolicyService is internal: callers go through OtpService.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Otp]), MailModule],
  providers: [OtpService, OtpPolicyService],
  exports: [OtpService],
})
export class OtpModule {}
