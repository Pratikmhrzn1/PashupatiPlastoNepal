import { ConfigService } from '@nestjs/config';
import { ResendMailer } from './resend.mailer.js';

describe('ResendMailer', () => {
  const sendMock = vi.fn();

  const buildMailer = (config: Record<string, string | undefined>) => {
    const configService = {
      get: vi.fn((key: string) => config[key]),
    } as unknown as ConfigService;

    const mailer = new ResendMailer(configService);
    // The Resend client is created in the constructor; replace its transport.
    (mailer as any).client = { emails: { send: sendMock } };

    return mailer;
  };
  beforeEach(() => {
    sendMock.mockReset();
  });

  it('reports the provider name', () => {
    expect(buildMailer({}).provider).toBe('resend');
  });

  it('sends html and text bodies', async () => {
    sendMock.mockResolvedValue({ data: { id: 'msg-1' }, error: null });

    const mailer = buildMailer({
      'mail.resendApiKey': 're_123',
      'mail.from': 'no-reply@example.com',
    });

    const result = await mailer.send({
      to: 'admin@example.com',
      subject: 'Verify your email address',
      html: '<p>html</p>',
      text: 'text',
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'admin@example.com',
      subject: 'Verify your email address',
      html: '<p>html</p>',
      text: 'text',
    });
    expect(result).toEqual({ id: 'msg-1', provider: 'resend' });
  });

  it('formats the from address with a display name', async () => {
    sendMock.mockResolvedValue({ data: { id: 'msg-1' }, error: null });

    const mailer = buildMailer({
      'mail.resendApiKey': 're_123',
      'mail.from': 'no-reply@example.com',
      'mail.fromName': 'Pashupati Plasto',
    });

    await mailer.send({
      to: 'admin@example.com',
      subject: 'Hello',
      html: '<p>html</p>',
      text: 'text',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Pashupati Plasto <no-reply@example.com>' }),
    );
  });

  it('throws when the provider rejects the message', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'Invalid api key' },
    });

    const mailer = buildMailer({
      'mail.resendApiKey': 'bad',
      'mail.from': 'no-reply@example.com',
    });

    await expect(
      mailer.send({
        to: 'admin@example.com',
        subject: 'Hello',
        html: '<p>html</p>',
        text: 'text',
      }),
    ).rejects.toThrow('Resend rejected the message: Invalid api key');
  });

  it('throws when no from address is configured', async () => {
    const mailer = buildMailer({ 'mail.resendApiKey': 're_123' });

    await expect(
      mailer.send({
        to: 'admin@example.com',
        subject: 'Hello',
        html: '<p>html</p>',
        text: 'text',
      }),
    ).rejects.toThrow('MAIL_FROM is not configured');
  });
});
