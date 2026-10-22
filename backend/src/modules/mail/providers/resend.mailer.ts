import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailService } from '../mail.service.js';
import type { MailMessage, MailSendResult } from '../mail.types.js';

@Injectable()
export class ResendMailer extends MailService {
  readonly provider = 'resend';

  private client?: Resend;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const { data, error } = await this.getClient().emails.send({
      from: this.fromAddress(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new Error(`Resend rejected the message: ${error.message}`);
    }

    return { id: data?.id ?? null, provider: this.provider };
  }

  private getClient(): Resend {
    if (!this.client) {
      const apiKey = this.configService.get<string>('mail.resendApiKey');

      if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      this.client = new Resend(apiKey);
    }

    return this.client;
  }

  private fromAddress(): string {
    const from = this.configService.get<string>('mail.from');
    const name = this.configService.get<string>('mail.fromName');

    if (!from) {
      throw new Error('MAIL_FROM is not configured');
    }

    return name ? `${name} <${from}>` : from;
  }
}
