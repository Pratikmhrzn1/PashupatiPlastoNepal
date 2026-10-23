import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { FiCheck, FiLoader, FiPlus, FiX } from "react-icons/fi"
import type { AdminProductDto, ProductStatus } from "@/services/types"
import { useCreateProduct, useUpdateProduct } from "./api"
import { ProductImageField } from "./ProductImageField"
import { inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

const STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"]
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ProductFormDialogProps {
  product?: AdminProductDto
  onClose: () => void
}

export function ProductFormDialog({ product, onClose }: ProductFormDialogProps) {
  const isEdit = Boolean(product)
  const titleId = "product-form-title"

  const [name, setName] = useState(product?.name ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [price, setPrice] = useState(
    product?.price === null || product?.price === undefined ? "" : String(product.price)
  )
  const [currency, setCurrency] = useState(product?.currency ?? "NPR")
  const [category, setCategory] = useState(product?.category ?? "")
  const [unit, setUnit] = useState(product?.unit ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "DRAFT")
  const [featured, setFeatured] = useState(product?.featured ?? false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const isPending = create.isPending || update.isPending

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    nameRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (isUploading) {
      setFormError("Wait for the image upload to finish first.")
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError("Give the product a name.")
      return
    }

    const trimmedSlug = slug.trim()
    if (trimmedSlug && !SLUG_PATTERN.test(trimmedSlug)) {
      setFormError("Slug must be lowercase letters, numbers and single hyphens.")
      return
    }

    const priceValue = price.trim() === "" ? null : Number(price)
    if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0)) {
      setFormError("Enter a valid price, or leave it empty.")
      return
    }

    const shared = {
      name: trimmedName,
      currency: currency.trim().toUpperCase() || "NPR",
      status,
      featured,
      images,
      ...(trimmedSlug ? { slug: trimmedSlug } : {}),
    }

    const onError = (cause: unknown) =>
      setFormError(cause instanceof Error ? cause.message : "Could not save the product.")

    if (product) {
      update.mutate(
        {
          id: product.id,
          payload: {
            ...shared,
            price: priceValue,
            description: description.trim() || null,
            category: category.trim() || null,
            unit: unit.trim() || null,
          },
        },
        { onSuccess: onClose, onError }
      )
      return
    }

    create.mutate(
      {
        ...shared,
        ...(priceValue !== null ? { price: priceValue } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(unit.trim() ? { unit: unit.trim() } : {}),
      },
      { onSuccess: onClose, onError }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-charcoal-950/45 backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-charcoal-800/10 bg-surface shadow-2xl shadow-charcoal-950/20 dark:border-white/10 dark:bg-surface sm:rounded-3xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-charcoal-800/15 sm:hidden dark:bg-white/15" />

        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-ink">
              {isEdit ? "Edit product" : "New product"}
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {isEdit
                ? "Update the catalogue entry and save your changes."
                : "Add a product to the catalogue."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product form"
            className={secondaryButton}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="product-name" className={labelClass}>
                  Name *
                </label>
                <input
                  ref={nameRef}
                  id="product-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="PVC Pipe 1 inch"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-slug" className={labelClass}>
                  Slug
                </label>
                <input
                  id="product-slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className={inputClass}
                  placeholder="pvc-pipe-1-inch"
                  spellCheck={false}
                  autoCapitalize="none"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  {isEdit
                    ? "Changing this updates the public URL."
                    : "Leave empty to generate it from the name."}
                </p>
              </div>

              <div>
                <label htmlFor="product-price" className={labelClass}>
                  Price
                </label>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className={inputClass}
                  placeholder="450"
                />
              </div>

              <div>
                <label htmlFor="product-currency" className={labelClass}>
                  Currency
                </label>
                <input
                  id="product-currency"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  maxLength={3}
                  className={inputClass}
                  placeholder="NPR"
                  autoCapitalize="characters"
                />
              </div>

              <div>
                <label htmlFor="product-category" className={labelClass}>
                  Category
                </label>
                <input
                  id="product-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                  placeholder="Pipes"
                />
              </div>

              <div>
                <label htmlFor="product-unit" className={labelClass}>
                  Unit
                </label>
                <input
                  id="product-unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  className={inputClass}
                  placeholder="piece"
                />
              </div>

              <div>
                <label htmlFor="product-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="product-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProductStatus)}
                  className={inputClass}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                    className="h-4 w-4 rounded border-charcoal-300 text-primary-600 focus:ring-primary-600"
                  />
                  Show in featured products
                </label>
              </div>

              <div className="sm:col-span-2">
                <ProductImageField
                  value={images}
                  onChange={setImages}
                  onUploadingChange={setIsUploading}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-description" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="product-description"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={inputClass}
                  placeholder="Short description shown on the site"
                />
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-800/15 bg-red-50/60 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-300"
              >
                {formError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-charcoal-800/10 bg-surface/95 px-6 py-4 dark:border-white/10">
            <button type="submit" disabled={isPending || isUploading} className={primaryButton}>
              {isPending || isUploading ? (
                <FiLoader className="animate-spin" aria-hidden="true" />
              ) : isEdit ? (
                <FiCheck aria-hidden="true" />
              ) : (
                <FiPlus aria-hidden="true" />
              )}
              {isUploading
                ? "Uploading image…"
                : isPending
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Create product"}
            </button>
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
