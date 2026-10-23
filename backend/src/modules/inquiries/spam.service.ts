import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const TURNSTILE_TIMEOUT_MS = 5_000;

export interface TurnstileResult {
  success: boolean;
  errorCodes: string[];
}

/**
 * Spam protection for public forms.
 *
 * Two independent layers are used:
 *
 * 1. A honeypot field that is hidden from humans. When it is filled in the
 *    submission is dropped silently instead of being rejected, so a bot gets
 *    no signal that it was detected.
 * 2. Cloudflare Turnstile, which is optional and only active when
 *    `ENABLE_TURNSTILE` is set.
 */
@Injectable()
export class SpamService {
  private readonly logger = new Logger(SpamService.name);

  constructor(private readonly configService: ConfigService) {}

  /** True when the honeypot field was filled in. */
  isHoneypotTriggered(honeypotValue?: string): boolean {
    return typeof honeypotValue === 'string' && honeypotValue.trim().length > 0;
  }

  isTurnstileEnabled(): boolean {
    return this.configService.get<boolean>('security.enableTurnstile') ?? false;
  }

  /**
   * Verifies a Turnstile token.
   *
   * Returns `true` when Turnstile is disabled, so the feature can be turned on
   * without touching the submission path.
   */
  async verifyTurnstile(
    token?: string,
    ipAddress?: string,
  ): Promise<TurnstileResult> {
    if (!this.isTurnstileEnabled()) {
      return { success: true, errorCodes: [] };
    }

    if (!token) {
      return { success: false, errorCodes: ['missing-input-response'] };
    }

    const secret = this.configService.get<string>(
      'security.turnstileSecretKey',
    );

    if (!secret) {
      this.logger.error(
        'Turnstile is enabled but TURNSTILE_SECRET_KEY is not configured.',
      );
      return { success: false, errorCodes: ['missing-secret-key'] };
    }

    const verifyUrl =
      this.configService.get<string>('security.turnstileVerifyUrl') ??
      DEFAULT_TURNSTILE_VERIFY_URL;

    const body = new URLSearchParams({ secret, response: token });

    if (ipAddress) {
      body.set('remoteip', ipAddress);
    }

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.error(
          `Turnstile verification failed with status ${response.status}.`,
        );
        return { success: false, errorCodes: ['http-error'] };
      }

      const result = (await response.json()) as {
        success?: boolean;
        'error-codes'?: string[];
      };

      const errorCodes = result['error-codes'] ?? [];

      if (!result.success) {
        this.logger.warn(
          `Turnstile rejected a submission: ${errorCodes.join(', ') || 'unknown reason'}`,
        );
      }

      return { success: result.success === true, errorCodes };
    } catch (error) {
      this.logger.error(
        `Turnstile verification request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { success: false, errorCodes: ['request-failed'] };
    }
  }
}
