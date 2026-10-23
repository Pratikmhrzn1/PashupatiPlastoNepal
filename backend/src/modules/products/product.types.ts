import { ProductStatus } from '@prisma/client';

/**
 * Wire shape consumed by the frontend (`frontend/src/services/types.ts`).
 * `price` is a pre-formatted string (e.g. "NPR 450 / piece") and `image` is a
 * single absolute/root-relative URL.
 */
export interface PublicProductResponse {
  id: string;
  name: string;
  price: string;
  description: string;
  image?: string;
  soldCount?: number;
}

export interface ProductResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminProductResponse extends ProductResponse {
  createdById: string;
  deletedAt: Date | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedProducts<T> {
  data: T[];
  meta: PaginationMeta;
}
