import type { InquiryStatus, ProductStatus } from "@/services/types"

const inquiryStyles: Record<InquiryStatus, string> = {
  NEW: "bg-accent-100 text-accent-800 dark:bg-accent-500/15 dark:text-accent-300",
  READ: "bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300",
  REPLIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  ARCHIVED: "bg-charcoal-100 text-charcoal-600 dark:bg-white/10 dark:text-charcoal-300",
}

const productStyles: Record<ProductStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  ARCHIVED: "bg-charcoal-100 text-charcoal-600 dark:bg-white/10 dark:text-charcoal-300",
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${inquiryStyles[status]}`}
    >
      {status}
    </span>
  )
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${productStyles[status]}`}
    >
      {status}
    </span>
  )
}

export const primaryButton =
  "group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-600/15 transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/20 active:translate-y-0 active:scale-[0.96] active:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-offset-canvas"

export const secondaryButton =
  "group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full border border-charcoal-800/10 bg-surface/95 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:-translate-y-px hover:border-charcoal-800/20 hover:bg-surface hover:shadow-md active:translate-y-0 active:scale-[0.96] active:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.06] dark:focus-visible:ring-offset-canvas"

export const dangerButton =
  "group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full border border-red-800/25 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:-translate-y-px hover:border-red-800/40 hover:bg-red-50 hover:shadow-md hover:shadow-red-900/5 active:translate-y-0 active:scale-[0.96] active:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:border-red-400/30 dark:text-red-300 dark:hover:border-red-300/40 dark:hover:bg-red-950/40 dark:focus-visible:ring-offset-canvas"

export const inputClass =
  "mt-1.5 block w-full rounded-xl border border-charcoal-800/10 bg-surface/95 px-3.5 py-2.5 text-sm text-ink shadow-sm backdrop-blur transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-muted/60 focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-600/15 dark:border-white/10 dark:bg-white/[0.02] dark:focus:border-primary-400 dark:focus:ring-primary-400/20"

export const labelClass = "block text-sm font-medium tracking-tight text-ink"

export const cardClass =
  "relative overflow-hidden rounded-3xl border border-charcoal-800/10 bg-surface/95 p-6 shadow-[0_1px_1px_rgba(15,23,42,0.01),0_20px_60px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-[box-shadow,border-color] duration-300 dark:border-white/10 dark:bg-surface/90 dark:shadow-[0_1px_1px_rgba(255,255,255,0.01),0_60px_120px_-80px_rgba(14,165,233,0.25)]"
