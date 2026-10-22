import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail.service.js';
import type { MailMessage, MailSendResult } from '../mail.types.js';

/**
 * Fallback transport used when no mail API key is configured.
 *
 * It writes the message to the log so development and test environments can
 * follow the verification / reset links without a real provider.
 */
@Injectable()
export class LoggingMailer extends MailService {
  readonly provider = 'logging';

  private readonly logger = new Logger(LoggingMailer.name);

  async send(message: MailMessage): Promise<MailSendResult> {
    this.logger.warn(
      `[mail] no provider configured, message not delivered. to=${message.to} subject="${message.subject}"`,
    );
    this.logger.debug(`[mail] body:\n${message.text}`);

    return { id: null, provider: this.provider };
  }
}
