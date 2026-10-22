import { MailService } from '../../src/modules/mail/mail.service.js';
import type {
  MailMessage,
  MailSendResult,
} from '../../src/modules/mail/mail.types.js';

/**
 * In-memory mail transport used by the test suite.
 *
 * It records every message so assertions can inspect what would have been
 * sent, and can be told to fail so delivery-error handling can be exercised.
 */
export class MockMailService extends MailService {
  readonly provider = 'mock';

  readonly sent: MailMessage[] = [];

  shouldFail = false;

  async send(message: MailMessage): Promise<MailSendResult> {
    if (this.shouldFail) {
      throw new Error('Mock transport failure');
    }

    this.sent.push(message);

    return { id: `mock-${this.sent.length}`, provider: this.provider };
  }

  /** Returns the most recently sent message. */
  last(): MailMessage | undefined {
    return this.sent[this.sent.length - 1];
  }

  /** Extracts the first URL found in the body of the most recent message. */
  lastLink(): string | undefined {
    const message = this.last();
    if (!message) {
      return undefined;
    }

    return message.html.match(/https?:\/\/[^\s"'<>]+/)?.[0];
  }

  /** Returns the token query parameter of the most recent link. */
  lastToken(): string | undefined {
    const link = this.lastLink();
    if (!link) {
      return undefined;
    }

    return new URL(link).searchParams.get('token') ?? undefined;
  }

  reset(): void {
    this.sent.length = 0;
    this.shouldFail = false;
  }
}
