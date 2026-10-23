import { useState } from "react"
import { motion } from "framer-motion"
import {
  FiArchive,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiStar,
  FiTrash2,
} from "react-icons/fi"
import type { AdminProductDto, ProductStatus } from "@/services/types"
import { EmptyState, ErrorState } from "@/shared/ui/States"
import { Skeleton } from "@/shared/ui/Skeleton"
import {
  useAdminProducts,
  useArchiveProduct,
  useDeleteProduct,
  usePublishProduct,
  useUnpublishProduct,
  useUpdateProduct,
} from "./api"
import { ProductFormDialog } from "./ProductFormDialog"
import {
  cardClass,
  dangerButton,
  inputClass,
  primaryButton,
  ProductStatusBadge,
  secondaryButton,
} from "./ui"

const STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"]
const PAGE_SIZE = 10

function formatPrice(product: AdminProductDto) {
  if (product.price === null) return "No price"

  const amount = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(product.price)

  return `${product.currency} ${amount}${product.unit ? ` / ${product.unit}` : ""}`
}

function ProductCard({ product, onEdit }: { product: AdminProductDto; onEdit: () => void }) {
  const publish = usePublishProduct()
  const unpublish = useUnpublishProduct()
  const archive = useArchiveProduct()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()

  const busy =
    publish.isPending ||
    unpublish.isPending ||
    archive.isPending ||
    update.isPending ||
    remove.isPending

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete "${product.name}"? It will be archived and hidden from the public site.`
      )
    ) {
      remove.mutate(product.id)
    }
  }

  const image = product.images[0]

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className={`${cardClass} flex flex-col gap-4 sm:flex-row sm:items-center`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
      <div className="flex min-w-0 flex-1 gap-4">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-charcoal-800/10 dark:ring-white/10"
          />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-charcoal-100 text-charcoal-500 dark:bg-white/10 dark:text-charcoal-300">
            <FiImage aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight text-ink">
              {product.name}
            </h3>
            <ProductStatusBadge status={product.status} />
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800 dark:bg-accent-500/15 dark:text-accent-300">
                <FiStar aria-hidden="true" /> Featured
              </span>
            )}
            {product.deletedAt && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                Deleted
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-muted">/{product.slug}</p>
          <p className="mt-1 text-sm text-ink">
            {formatPrice(product)}
            {product.category && <span className="text-ink-muted"> · {product.category}</span>}
          </p>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
        {product.status !== "ACTIVE" && !product.deletedAt && (
          <button
            type="button"
            disabled={busy}
            onClick={() => publish.mutate(product.id)}
            className={secondaryButton}
          >
            <FiEye aria-hidden="true" /> Publish
          </button>
        )}
        {product.status === "ACTIVE" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => unpublish.mutate(product.id)}
            className={secondaryButton}
          >
            <FiEyeOff aria-hidden="true" /> Unpublish
          </button>
        )}
        {!product.deletedAt && (
          <button type="button" disabled={busy} onClick={onEdit} className={secondaryButton}>
            <FiEdit3 aria-hidden="true" /> Edit
          </button>
        )}
        {product.status !== "ARCHIVED" && !product.deletedAt && (
          <button
            type="button"
            disabled={busy}
            onClick={() => archive.mutate(product.id)}
            className={secondaryButton}
          >
            <FiArchive aria-hidden="true" /> Archive
          </button>
        )}
        {!product.deletedAt && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              update.mutate({ id: product.id, payload: { featured: !product.featured } })
            }
            className={secondaryButton}
          >
            <FiStar aria-hidden="true" />
            {product.featured ? "Unfeature" : "Feature"}
          </button>
        )}
        {!product.deletedAt && (
          <button type="button" disabled={busy} onClick={handleDelete} className={dangerButton}>
            <FiTrash2 aria-hidden="true" /> Delete
          </button>
        )}
      </div>
    </motion.article>
  )
}

export function ProductsPanel() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ProductStatus | "">("")
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [formProduct, setFormProduct] = useState<AdminProductDto | null | undefined>(undefined)

  const { data, isPending, isError, isFetching, refetch, error } = useAdminProducts({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(includeDeleted ? { includeDeleted } : {}),
  })

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <section aria-labelledby="products-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="products-heading" className="text-lg font-semibold tracking-tight text-ink">
            Products
          </h2>
          <p className="text-sm text-ink-muted">Manage the catalogue shown on the public site.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className={secondaryButton}
          >
            <FiRefreshCw className={isFetching ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
          <button type="button" onClick={() => setFormProduct(null)} className={primaryButton}>
            <FiPlus aria-hidden="true" />
            New product
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 sm:max-w-md">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, slug, description…"
            aria-label="Search products"
            className={`${inputClass} mt-0 rounded-full`}
          />
          <button type="submit" className={secondaryButton}>
            Search
          </button>
        </form>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ProductStatus | "")
            setPage(1)
          }}
          aria-label="Filter products by status"
          className={`${inputClass} mt-0 w-auto rounded-full`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(event) => {
              setIncludeDeleted(event.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 rounded border-charcoal-300 text-primary-600 focus:ring-primary-600"
          />
          Include deleted
        </label>
      </div>

      <div className="mt-6 space-y-4">
        {isPending ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-3xl" />
          ))
        ) : isError ? (
          <ErrorState
            title="Could not load products"
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : data && data.data.length > 0 ? (
          data.data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setFormProduct(product)}
            />
          ))
        ) : (
          <EmptyState
            title="No products found"
            description="Create a product or adjust the search filters."
          />
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
          <span>
            Page {data.meta.page} of {data.meta.totalPages} · {data.meta.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!data.meta.hasPreviousPage}
              className={secondaryButton}
            >
              <FiChevronLeft aria-hidden="true" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!data.meta.hasNextPage}
              className={secondaryButton}
            >
              Next <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {formProduct !== undefined && (
        <ProductFormDialog
          key={formProduct?.id ?? "new"}
          product={formProduct ?? undefined}
          onClose={() => setFormProduct(undefined)}
        />
      )}
    </section>
  )
}
