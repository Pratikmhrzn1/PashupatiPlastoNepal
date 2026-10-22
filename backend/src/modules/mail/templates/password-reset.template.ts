import { layout, textLayout } from './layout.template.js';

export interface PasswordResetTemplateOptions {
  adminEmail: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordResetTemplate(options: PasswordResetTemplateOptions) {
  const { adminEmail, resetUrl, expiresInMinutes } = options;

  const subject = 'Reset your password';

  const html = layout({
    preheader: 'A password reset was requested for your admin account.',
    heading: 'Reset your password',
    body: `A password reset was requested for <strong>${adminEmail}</strong>. Use the button below to choose a new password.`,
    actionLabel: 'Choose a new password',
    actionUrl: resetUrl,
    footnote: `This link expires in ${expiresInMinutes} minutes and can only be used once. If you did not request a reset, no action is needed and your password stays unchanged.`,
  });

  const text = textLayout({
    preheader: 'A password reset was requested for your admin account.',
    heading: 'Reset your password',
    body: `A password reset was requested for ${adminEmail}. Use the link below to choose a new password.`,
    actionLabel: 'Choose a new password',
    actionUrl: resetUrl,
    footnote: `This link expires in ${expiresInMinutes} minutes and can only be used once. If you did not request a reset, no action is needed and your password stays unchanged.`,
  });

  return { subject, html, text };
}
