import { layout, textLayout } from './layout.template.js';
import { escapeHtml } from '../../../common/utils/sanitize.utils.js';

export interface InquiryConfirmationTemplateOptions {
  name: string;
  subject: string;
}

const FOOTER_NOTE =
  'You are receiving this email because you contacted Pashupati Plasto.';

/**
 * Optional auto-confirmation sent to the visitor after their inquiry was
 * stored, so they know the message reached us.
 */
export function inquiryConfirmationTemplate(
  options: InquiryConfirmationTemplateOptions,
) {
  const { name, subject } = options;

  const subjectLine = 'We received your message';

  const html = layout({
    preheader: 'Thanks for getting in touch with Pashupati Plasto.',
    heading: 'Thanks for reaching out',
    body: `Hi ${escapeHtml(name)},<br /><br />We have received your message about &quot;${escapeHtml(subject)}&quot;. Our team will get back to you shortly.`,
    footerNote: FOOTER_NOTE,
  });

  const text = textLayout({
    preheader: 'Thanks for getting in touch with Pashupati Plasto.',
    heading: 'Thanks for reaching out',
    body: `Hi ${name}, we have received your message about "${subject}". Our team will get back to you shortly.`,
    footerNote: FOOTER_NOTE,
  });

  return { subject: subjectLine, html, text };
}
