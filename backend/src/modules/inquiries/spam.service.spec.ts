import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SpamService } from './spam.service.js';

describe('SpamService', () => {
  let service: SpamService;
  let configValues: Record<string, unknown>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    configValues = {
      'security.enableTurnstile': false,
      'security.turnstileSecretKey': 'secret-key',
    };

    fetchMock = vi.fn();

    vi.stubGlobal('fetch', fetchMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpamService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => configValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get(SpamService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isHoneypotTriggered', () => {
    it('is triggered by a filled honeypot field', () => {
      expect(service.isHoneypotTriggered('http://spam.example')).toBe(true);
    });

    it('is not triggered by whitespace only content', () => {
      expect(service.isHoneypotTriggered('   ')).toBe(false);
    });

    it('is not triggered by an empty field', () => {
      expect(service.isHoneypotTriggered('')).toBe(false);
      expect(service.isHoneypotTriggered(undefined)).toBe(false);
    });
  });

  describe('verifyTurnstile', () => {
    it('passes when turnstile is disabled', async () => {
      const result = await service.verifyTurnstile(undefined);

      expect(result.success).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails when turnstile is enabled and no token was sent', async () => {
      configValues['security.enableTurnstile'] = true;

      const result = await service.verifyTurnstile(undefined);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-input-response');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails when the secret key is missing', async () => {
      configValues['security.enableTurnstile'] = true;
      configValues['security.turnstileSecretKey'] = undefined;

      const result = await service.verifyTurnstile('token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-secret-key');
    });

    it('passes when the provider accepts the token', async () => {
      configValues['security.enableTurnstile'] = true;

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const result = await service.verifyTurnstile('token', '203.0.113.5');

      expect(result.success).toBe(true);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/turnstile/v0/siteverify');
      expect(options.body.get('secret')).toBe('secret-key');
      expect(options.body.get('response')).toBe('token');
      expect(options.body.get('remoteip')).toBe('203.0.113.5');
    });

    it('fails when the provider rejects the token', async () => {
      configValues['security.enableTurnstile'] = true;

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-token'],
        }),
      });

      const result = await service.verifyTurnstile('token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toEqual(['invalid-token']);
    });

    it('fails when the provider returns an error status', async () => {
      configValues['security.enableTurnstile'] = true;

      fetchMock.mockResolvedValue({ ok: false, status: 503 });

      const result = await service.verifyTurnstile('token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('http-error');
    });

    it('fails when the request throws', async () => {
      configValues['security.enableTurnstile'] = true;

      fetchMock.mockRejectedValue(new Error('network down'));

      const result = await service.verifyTurnstile('token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('request-failed');
    });
  });
});
