/**
 * Minimal, inline-styled HTML email layout.
 *
 * Email clients strip external stylesheets and many ignore `<style>` blocks, so
 * everything here is inline. Tables are used for layout because they are the
 * only thing Outlook renders consistently.
 */
export interface LayoutOptions {
  preheader: string;
  heading: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  footnote?: string;
}

const BRAND = 'Pashupati Plasto';

export function layout(options: LayoutOptions): string {
  const { preheader, heading, body, actionLabel, actionUrl, footnote } = options;

  const button = actionUrl
    ? `<tr>
        <td align="center" style="padding:8px 32px 32px;">
          <a href="${actionUrl}"
             style="display:inline-block;background:#1f7a5c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
            ${actionLabel}
          </a>
        </td>
      </tr>`
    : '';

  const actionFallback = actionUrl
    ? `<p style="margin:0 0 24px;color:#5b6472;font-size:13px;line-height:20px;">
         If the button does not work, copy and paste this link into your browser:<br />
         <span style="color:#1f7a5c;word-break:break-all;">${actionUrl}</span>
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c2430;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e7ec;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #eceff2;">
                <span style="font-size:17px;font-weight:700;color:#1f7a5c;letter-spacing:-0.2px;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <h1 style="margin:0 0 16px;font-size:21px;line-height:28px;font-weight:650;color:#1c2430;">${heading}</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#40495a;">${body}</p>
                ${actionFallback}
              </td>
            </tr>
            ${button}
            ${
              footnote
                ? `<tr>
              <td style="padding:0 32px 28px;">
                <p style="margin:0;font-size:12px;line-height:19px;color:#7b8494;">${footnote}</p>
              </td>
            </tr>`
                : ''
            }
            <tr>
              <td style="padding:20px 32px;background:#fafbfc;border-top:1px solid #eceff2;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#8b93a1;">
                  You are receiving this email because someone used this address on the ${BRAND} admin panel.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function textLayout(options: LayoutOptions): string {
  const { heading, body, actionLabel, actionUrl, footnote } = options;

  return [
    heading,
    '',
    body.replace(/<[^>]+>/g, ''),
    actionUrl ? `\n${actionLabel ?? 'Open'}: ${actionUrl}` : '',
    footnote ? `\n${footnote}` : '',
    '',
    `You are receiving this email because someone used this address on the ${BRAND} admin panel.`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}
