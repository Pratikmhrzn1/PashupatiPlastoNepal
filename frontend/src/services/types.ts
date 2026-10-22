/**
 * API DTOs — the shapes the backend (or mocks) returns over the wire.
 * Feature-level types may extend these, but the wire format lives here only.
 */

export interface TranslatableText {
  en: string;
  ne: string;
}

export interface ProductDto {
  id: string;
  name: string;
  price: string;
  description: string;
  image?: string;
  /** Lifetime units sold — backend uses it to rank "most bought" products. */
  soldCount?: number;
}

export interface MemberDto {
  id: string;
  name: TranslatableText;
  badge: TranslatableText;
  role: TranslatableText;
  since: string;
  image?: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactResponse {
  ok: boolean;
}
