/**
 * Helpers that turn untrusted visitor input into plain text.
 *
 * Inquiries are rendered back to admins (in the dashboard and in notification
 * emails), so anything that survives the round trip is stripped of markup,
 * control characters and repeated whitespace.
 */

// eslint-disable-next-line no-control-regex -- control characters are stripped on purpose
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const HTML_TAGS = /<\/?[a-z][^>]*>|<!--[\s\S]*?-->/gi;

/**
 * Removes markup and control characters, then collapses whitespace.
 *
 * Line breaks are preserved so multi-line messages stay readable.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(HTML_TAGS, '')
    .replace(CONTROL_CHARACTERS, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Same as {@link sanitizeText} but for single-line fields.
 *
 * Newlines are collapsed into spaces so a value can never break out of the
 * line it was written for.
 */
export function sanitizeSingleLine(input: string): string {
  return sanitizeText(input).replace(/\s*\n\s*/g, ' ');
}

/**
 * Escapes the five characters that carry meaning in HTML.
 *
 * Used when visitor content is embedded in an email template.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
