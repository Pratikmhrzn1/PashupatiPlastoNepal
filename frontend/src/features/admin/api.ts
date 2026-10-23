import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  adminLogin,
  adminLogout,
  archiveAdminProduct,
  createAdminProduct,
  deleteAdminInquiry,
  deleteAdminProduct,
  getAdminInquiries,
  getAdminProducts,
  getCurrentAdmin,
  publishAdminProduct,
  unpublishAdminProduct,
  updateAdminInquiryNote,
  updateAdminInquiryStatus,
  updateAdminProduct,
  uploadAdminProductImage,
} from "@/services/api"
import type {
  AdminInquiryDto,
  AdminInquiryQuery,
  AdminProductDto,
  AdminProductQuery,
  InquiryStatus,
  Paginated,
  UpdateProductPayload,
} from "@/services/types"

/**
 * Admin feature — query keys, hooks and cache invalidation.
 * Keys follow the app-wide convention: ['admin', '<resource>', ...params].
 */
export const adminKeys = {
  all: ["admin"] as const,
  session: () => [...adminKeys.all, "session"] as const,
  inquiries: (query: AdminInquiryQuery) => [...adminKeys.all, "inquiries", query] as const,
  products: (query: AdminProductQuery) => [...adminKeys.all, "products", query] as const,
}

const inquiriesRoot = [...adminKeys.all, "inquiries"] as const
const productsRoot = [...adminKeys.all, "products"] as const

export function useAdminSession() {
  return useQuery({
    queryKey: adminKeys.session(),
    queryFn: getCurrentAdmin,
    retry: false,
    staleTime: 60_000,
  })
}

export function useAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.session(), data.admin)
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminLogout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: adminKeys.all })
    },
  })
}

export function useAdminInquiries(query: AdminInquiryQuery) {
  return useQuery({
    queryKey: adminKeys.inquiries(query),
    queryFn: () => getAdminInquiries(query),
    placeholderData: (previous) => previous,
  })
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      updateAdminInquiryStatus(id, status),
    // Patch the cache immediately so the select doesn't snap back while the
    // request is in flight.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: inquiriesRoot })
      const snapshots = queryClient.getQueriesData<Paginated<AdminInquiryDto>>({
        queryKey: inquiriesRoot,
      })

      queryClient.setQueriesData<Paginated<AdminInquiryDto>>(
        { queryKey: inquiriesRoot },
        (previous) =>
          previous
            ? {
                ...previous,
                data: previous.data.map((item) => (item.id === id ? { ...item, status } : item)),
              }
            : previous
      )

      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: inquiriesRoot }),
  })
}

export function useUpdateInquiryNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) =>
      updateAdminInquiryNote(id, note),
    onSuccess: (updated) => {
      queryClient.setQueriesData<{ data: AdminInquiryDto[] }>(
        { queryKey: inquiriesRoot },
        (previous) =>
          previous
            ? {
                ...previous,
                data: previous.data.map((item) => (item.id === updated.id ? updated : item)),
              }
            : previous
      )
    },
  })
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAdminInquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inquiriesRoot }),
  })
}

export function useAdminProducts(query: AdminProductQuery) {
  return useQuery({
    queryKey: adminKeys.products(query),
    queryFn: () => getAdminProducts(query),
    placeholderData: (previous) => previous,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsRoot }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      updateAdminProduct(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsRoot }),
  })
}

export function useUploadProductImage() {
  return useMutation({ mutationFn: uploadAdminProductImage })
}

type ProductAction = (id: string) => Promise<AdminProductDto>

export function useProductStatusAction(action: ProductAction) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: action,
    onSuccess: (updated) => {
      queryClient.setQueriesData<{ data: AdminProductDto[] }>(
        { queryKey: productsRoot },
        (previous) =>
          previous
            ? {
                ...previous,
                data: previous.data.map((item) => (item.id === updated.id ? updated : item)),
              }
            : previous
      )
    },
  })
}

export function usePublishProduct() {
  return useProductStatusAction(publishAdminProduct)
}

export function useUnpublishProduct() {
  return useProductStatusAction(unpublishAdminProduct)
}

export function useArchiveProduct() {
  return useProductStatusAction(archiveAdminProduct)
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsRoot }),
  })
}
