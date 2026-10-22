import { layout, textLayout } from './layout.template.js';

export interface EmailVerificationTemplateOptions {
  adminEmail: string;
  verificationUrl: string;
  expiresInHours: number;
}

export function emailVerificationTemplate(
  options: EmailVerificationTemplateOptions,
) {
  const { adminEmail, verificationUrl, expiresInHours } = options;

  const subject = 'Verify your email address';

  const html = layout({
    preheader: `Confirm your email address to activate your ${'Pashupati Plasto'} admin account.`,
    heading: 'Verify your email address',
    body: `We created an admin account for <strong>${adminEmail}</strong>. Confirm this address to activate the account.`,
    actionLabel: 'Verify email address',
    actionUrl: verificationUrl,
    footnote: `This link expires in ${expiresInHours} hours and can only be used once. If you did not request this, you can ignore this email.`,
  });

  const text = textLayout({
    preheader: 'Confirm your email address to activate your admin account.',
    heading: 'Verify your email address',
    body: `We created an admin account for ${adminEmail}. Confirm this address to activate the account.`,
    actionLabel: 'Verify email address',
    actionUrl: verificationUrl,
    footnote: `This link expires in ${expiresInHours} hours and can only be used once. If you did not request this, you can ignore this email.`,
  });

  return { subject, html, text };
}
