import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';
import { ResendMailer } from './providers/resend.mailer.js';
import { LoggingMailer } from './providers/logging.mailer.js';

@Module({
  providers: [
    {
      provide: MailService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('mail.resendApiKey');

        if (!apiKey) {
          return new LoggingMailer();
        }

        return new ResendMailer(configService);
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
