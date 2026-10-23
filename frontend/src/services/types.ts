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

/* -------------------------------------------------------------------------- */
/* Admin panel                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminRole = "ADMIN";

export type InquiryStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type SortOrder = "asc" | "desc";

export interface AdminDto {
  id: string;
  email: string;
  role: AdminRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: AdminDto;
}

export interface AdminInquiryDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  productId: string | null;
  status: InquiryStatus;
  internalNote: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  currency: string;
  unit: string | null;
  images: string[];
  category: string | null;
  status: ProductStatus;
  featured: boolean;
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AdminInquiryQuery {
  page?: number;
  limit?: number;
  status?: InquiryStatus;
  search?: string;
  sort?: "createdAt" | "updatedAt" | "name" | "status";
  order?: SortOrder;
}

export interface AdminProductQuery {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  search?: string;
  category?: string;
  featured?: boolean;
  includeDeleted?: boolean;
  sort?: "createdAt" | "updatedAt" | "name" | "price";
  order?: SortOrder;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: string;
  unit?: string;
  images?: string[];
  category?: string;
  status?: ProductStatus;
  featured?: boolean;
}

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, "price" | "description" | "unit" | "category">
> & {
  price?: number | null;
  description?: string | null;
  unit?: string | null;
  category?: string | null;
};

export interface UploadedImage {
  url: string;
  path: string;
}
