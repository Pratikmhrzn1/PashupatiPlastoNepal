import { http } from "./http";
import type { ContactPayload, ContactResponse, MemberDto, ProductDto } from "./types";

/**
 * Typed API surface. Features import from here (via their own api.ts wrappers),
 * never from http.ts directly. Swapping mock→live changes nothing in this file —
 * MSW intercepts /api in mock mode; in live mode requests hit the real baseURL.
 */

export function getProducts(): Promise<ProductDto[]> {
  return http<ProductDto[]>("/products");
}

export function getProduct(id: string): Promise<ProductDto> {
  return http<ProductDto>(`/products/${id}`);
}

export function getFeaturedProducts(): Promise<ProductDto[]> {
  return http<ProductDto[]>("/products/featured");
}

export function getMembers(): Promise<MemberDto[]> {
  return http<MemberDto[]>("/members");
}

export function submitContact(payload: ContactPayload): Promise<ContactResponse> {
  return http<ContactResponse>("/contacts", { method: "POST", body: payload });
}
