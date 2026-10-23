import { InquiryStatus } from '@prisma/client';

/** Result of a public inquiry submission. */
export interface InquirySubmissionResult {
  id: string;
  status: InquiryStatus;
  message: string;
  submittedAt: Date;
}

/** Inquiry shape returned to the visitor who submitted it. */
export interface InquiryResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  productId: string | null;
  status: InquiryStatus;
  createdAt: Date;
}

/** Inquiry shape returned to admins - includes the fields visitors never see. */
export interface AdminInquiryResponse extends InquiryResponse {
  phone: string | null;
  ipAddress: string | null;
  internalNote: string | null;
  updatedAt: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedInquiries<T> {
  data: T[];
  meta: PaginationMeta;
}
