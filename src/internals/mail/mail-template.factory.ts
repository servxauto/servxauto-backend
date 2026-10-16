import { Injectable } from '@nestjs/common';
import { OtpMailPaylaod } from './mail.interface';
import { ISendMailOptions } from '@nestjs-modules/mailer';

@Injectable()
export class MailTemplateFactory {
  otpMail(email: string, paylaod: OtpMailPaylaod): ISendMailOptions {
    // Prepare the context object with dynamic values to be passed to the email template.
    const context = {
      code: paylaod.code,
      username: paylaod.username,
    };

    // Return the final email options for the mailer.
    return {
      to: email,
      subject: 'Requested OTP', // Template name for the email body.
      template: 'otp-mail',
      context,
    };
  }
}
