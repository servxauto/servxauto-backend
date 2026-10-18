import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { MAIL_QUEUE } from './mail.constants';
import { MailProducer } from './producers/mail.producer';
import { MailConsumer } from './consumers/mail.consumer';
import { MailTemplateFactory } from './mail-template.factory';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('MAIL_HOST'),
          port: Number(configService.get('MAIL_PORT', 465)),
          secure: true,
          auth: {
            user: configService.getOrThrow<string>('MAIL_USER'),
            pass: configService.getOrThrow<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${configService.get('MAIL_FROM_NAME', 'ServXAuto')}" <${configService.getOrThrow<string>('MAIL_USER')}>`,
        },
        template: {
          dir: join(process.cwd(), 'src/internals/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.getOrThrow<string>('REDIS_URL'),
      }),
    }),
    BullModule.registerQueue({
      name: MAIL_QUEUE,
    }),
  ],
  providers: [MailTemplateFactory, MailService, MailProducer, MailConsumer],
  exports: [MailService],
})
export class MailModule {}
