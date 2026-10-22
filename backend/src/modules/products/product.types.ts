import { ProductStatus } from '@prisma/client';

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  currency: string;
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
