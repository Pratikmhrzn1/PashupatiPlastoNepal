import { http } from "./http";
import type {
  AdminDto,
  AdminInquiryDto,
  AdminInquiryQuery,
  AdminLoginPayload,
  AdminLoginResponse,
  AdminProductDto,
  AdminProductQuery,
  ContactPayload,
  ContactResponse,
  CreateProductPayload,
  InquiryStatus,
  MemberDto,
  Paginated,
  ProductDto,
  UpdateProductPayload,
  UploadedImage,
} from "./types";

/**
 * Typed API surface. Features import from here (via their own api.ts wrappers),
 * never from http.ts directly. Swapping mock→live changes nothing in this file —
 * MSW intercepts /api in mock mode; in live mode requests hit the real baseURL.
 */

export function getProducts(): Promise<ProductDto[]> {
  return http<ProductDto[]>("/api/products");
}

export function getProduct(id: string): Promise<ProductDto> {
  return http<ProductDto>(`/api/products/${id}`);
}

export function getFeaturedProducts(): Promise<ProductDto[]> {
  return http<ProductDto[]>("/api/products/featured");
}

export function getMembers(): Promise<MemberDto[]> {
  return http<MemberDto[]>("/members");
}

export function submitContact(payload: ContactPayload): Promise<ContactResponse> {
  return http<ContactResponse>("/api/contacts", { method: "POST", body: payload });
}

/* -------------------------------------------------------------------------- */
/* Admin auth                                                                 */
/* -------------------------------------------------------------------------- */

export function adminLogin(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
  // Auth routes are under /api/v1
  return http<AdminLoginResponse>("/api/v1/auth/login", { method: "POST", body: payload });
}

export function adminLogout(): Promise<{ message: string }> {
  return http<{ message: string }>("/api/v1/auth/logout", { method: "POST" });
}

export function getCurrentAdmin(): Promise<AdminDto> {
  return http<AdminDto>("/api/v1/auth/me");
}

/* -------------------------------------------------------------------------- */
/* Admin inquiries                                                            */
/* -------------------------------------------------------------------------- */

export function getAdminInquiries(query: AdminInquiryQuery = {}): Promise<Paginated<AdminInquiryDto>> {
  return http<Paginated<AdminInquiryDto>>("/api/v1/admin/inquiries", { params: query as Record<string, string | number | boolean | undefined> });
}

export function getAdminInquiry(id: string): Promise<AdminInquiryDto> {
  return http<AdminInquiryDto>(`/api/v1/admin/inquiries/${id}`);
}

export function updateAdminInquiryStatus(id: string, status: InquiryStatus): Promise<AdminInquiryDto> {
  return http<AdminInquiryDto>(`/api/v1/admin/inquiries/${id}/status`, { method: "PATCH", body: { status } });
}

export function updateAdminInquiryNote(id: string, note: string | null): Promise<AdminInquiryDto> {
  return http<AdminInquiryDto>(`/api/v1/admin/inquiries/${id}/note`, { method: "PATCH", body: { note } });
}

export function deleteAdminInquiry(id: string): Promise<void> {
  return http<void>(`/api/v1/admin/inquiries/${id}`, { method: "DELETE" });
}

/* -------------------------------------------------------------------------- */
/* Admin products                                                             */
/* -------------------------------------------------------------------------- */

export function getAdminProducts(query: AdminProductQuery = {}): Promise<Paginated<AdminProductDto>> {
  return http<Paginated<AdminProductDto>>("/api/v1/admin/products", { params: query as Record<string, string | number | boolean | undefined> });
}

export function getAdminProduct(id: string): Promise<AdminProductDto> {
  return http<AdminProductDto>(`/api/v1/admin/products/${id}`);
}

export function createAdminProduct(payload: CreateProductPayload): Promise<AdminProductDto> {
  return http<AdminProductDto>("/api/v1/admin/products", { method: "POST", body: payload });
}

export function updateAdminProduct(id: string, payload: UpdateProductPayload): Promise<AdminProductDto> {
  return http<AdminProductDto>(`/api/v1/admin/products/${id}`, { method: "PATCH", body: payload });
}

export function uploadAdminProductImage(data: string): Promise<UploadedImage> {
  return http<UploadedImage>("/api/v1/admin/uploads/product-image", {
    method: "POST",
    body: { data },
  });
}

export function publishAdminProduct(id: string): Promise<AdminProductDto> {
  return http<AdminProductDto>(`/api/v1/admin/products/${id}/publish`, { method: "PATCH" });
}

export function unpublishAdminProduct(id: string): Promise<AdminProductDto> {
  return http<AdminProductDto>(`/api/v1/admin/products/${id}/unpublish`, { method: "PATCH" });
}

export function archiveAdminProduct(id: string): Promise<AdminProductDto> {
  return http<AdminProductDto>(`/api/v1/admin/products/${id}/archive`, { method: "PATCH" });
}

export function deleteAdminProduct(id: string): Promise<void> {
  return http<void>(`/api/v1/admin/products/${id}`, { method: "DELETE" });
}

export function hardDeleteAdminProduct(id: string): Promise<void> {
  return http<void>(`/api/v1/admin/products/${id}/hard`, { method: "DELETE" });
}
