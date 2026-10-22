export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailSendResult {
  /** Provider-side message id. Null when the provider does not return one. */
  id: string | null;
  /** Identifier of the transport that handled the message. */
  provider: string;
}
