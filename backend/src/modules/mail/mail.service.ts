import type { MailMessage, MailSendResult } from './mail.types.js';

/**
 * Transport-agnostic mail contract.
 *
 * Declared as an abstract class rather than an interface so it can double as a
 * Nest injection token, which keeps providers swappable (Resend in production,
 * a logger in development, a stub in tests).
 */
export abstract class MailService {
  /** Identifier of the transport implementation handling the message. */
  abstract readonly provider: string;

  /**
   * Delivers a message.
   *
   * Implementations must throw on failure so callers can decide whether a
   * delivery failure should fail the surrounding request.
   */
  abstract send(message: MailMessage): Promise<MailSendResult>;
}
