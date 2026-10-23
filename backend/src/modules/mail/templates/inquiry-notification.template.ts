import { layout, textLayout } from './layout.template.js';
import { escapeHtml } from '../../../common/utils/sanitize.utils.js';

export interface InquiryNotificationTemplateOptions {
  inquiryId: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  productName?: string | null;
  submittedAt: Date;
}

/**
 * Email sent to the admin when a visitor submits the contact form.
 *
 * All visitor supplied values are HTML-escaped before they are embedded in
 * the template.
 */
export function inquiryNotificationTemplate(
  options: InquiryNotificationTemplateOptions,
) {
  const { inquiryId, name, email, phone, subject, message, productName } =
    options;

  const details = [
    `<tr>
      <td align="right" style="padding:4px 12px 4px 0;font-size:13px;color:#7b8494;white-space:nowrap;">Name</td>
      <td style="padding:4px 0;font-size:14px;color:#1c2430;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td align="right" style="padding:4px 12px 4px 0;font-size:13px;color:#7b8494;white-space:nowrap;">Email</td>
      <td style="padding:4px 0;font-size:14px;color:#1c2430;">
        <a href="mailto:${escapeHtml(email)}" style="color:#1f7a5c;">${escapeHtml(email)}</a>
      </td>
    </tr>`,
    phone
      ? `<tr>
      <td align="right" style="padding:4px 12px 4px 0;font-size:13px;color:#7b8494;white-space:nowrap;">Phone</td>
      <td style="padding:4px 0;font-size:14px;color:#1c2430;">${escapeHtml(phone)}</td>
    </tr>`
      : '',
    productName
      ? `<tr>
      <td align="right" style="padding:4px 12px 4px 0;font-size:13px;color:#7b8494;white-space:nowrap;">Product</td>
      <td style="padding:4px 0;font-size:14px;color:#1c2430;">${escapeHtml(productName)}</td>
    </tr>`
      : '',
  ].join('');

  const htmlBody = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${details}
    </table>
    <div style="padding:16px;background:#f7f9fa;border:1px solid #e3e7ec;border-radius:8px;font-size:14px;line-height:22px;color:#1c2430;white-space:pre-wrap;">${escapeHtml(message)}</div>`;

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : '',
    productName ? `Product: ${productName}` : '',
    '',
    message,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const mailSubject = `New inquiry: ${subject}`;

  const html = layout({
    preheader: `New contact form inquiry from ${name}`,
    heading: 'New inquiry received',
    body: htmlBody,
    footnote: `Inquiry ${inquiryId} - open it in the admin panel to reply.`,
  });

  const text = textLayout({
    preheader: `New contact form inquiry from ${name}`,
    heading: 'New inquiry received',
    body: textBody,
    footnote: `Inquiry ${inquiryId} - open it in the admin panel to reply.`,
  });

  return { subject: mailSubject, html, text };
}
