import { useState } from "react"
import { motion } from "framer-motion"
import { FiChevronLeft, FiChevronRight, FiMail, FiRefreshCw, FiTrash2 } from "react-icons/fi"
import type { AdminInquiryDto, InquiryStatus } from "@/services/types"
import { EmptyState, ErrorState } from "@/shared/ui/States"
import { Skeleton } from "@/shared/ui/Skeleton"
import {
  useAdminInquiries,
  useDeleteInquiry,
  useUpdateInquiryNote,
  useUpdateInquiryStatus,
} from "./api"
import { cardClass, dangerButton, InquiryStatusBadge, inputClass, secondaryButton } from "./ui"

const STATUSES: InquiryStatus[] = ["NEW", "READ", "REPLIED", "ARCHIVED"]
const PAGE_SIZE = 10

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function InquiryCard({ inquiry }: { inquiry: AdminInquiryDto }) {
  const [note, setNote] = useState(inquiry.internalNote ?? "")
  const updateStatus = useUpdateInquiryStatus()
  const updateNote = useUpdateInquiryNote()
  const remove = useDeleteInquiry()

  const noteChanged = note !== (inquiry.internalNote ?? "")

  const handleDelete = () => {
    if (window.confirm(`Delete the inquiry from ${inquiry.name}? This cannot be undone.`)) {
      remove.mutate(inquiry.id)
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className={cardClass}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-ink">{inquiry.name}</h3>
            <InquiryStatusBadge status={inquiry.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <a
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary-600"
              href={`mailto:${inquiry.email}`}
            >
              <FiMail aria-hidden="true" />
              {inquiry.email}
            </a>
            {inquiry.phone && <span>· {inquiry.phone}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`status-${inquiry.id}`}>
            Status
          </label>
          <select
            id={`status-${inquiry.id}`}
            value={inquiry.status}
            disabled={updateStatus.isPending}
            onChange={(event) =>
              updateStatus.mutate({
                id: inquiry.id,
                status: event.target.value as InquiryStatus,
              })
            }
            className={`${inputClass} mt-0 w-auto rounded-full py-1.5`}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDelete}
            disabled={remove.isPending}
            className={dangerButton}
            aria-label={`Delete inquiry from ${inquiry.name}`}
          >
            <FiTrash2 aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-charcoal-800/8 bg-charcoal-50/40 p-4 dark:border-white/8 dark:bg-white/[0.02]">
        <p className="text-sm font-semibold tracking-tight text-ink">{inquiry.subject}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
          {inquiry.message}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 text-xs text-ink-muted sm:grid-cols-3">
        <div className="rounded-xl border border-charcoal-800/8 px-3 py-2 dark:border-white/8">
          <dt className="font-medium text-ink-muted/70">Received</dt>
          <dd className="mt-0.5 text-ink">{formatDate(inquiry.createdAt)}</dd>
        </div>
        <div className="rounded-xl border border-charcoal-800/8 px-3 py-2 dark:border-white/8">
          <dt className="font-medium text-ink-muted/70">Product</dt>
          <dd className="mt-0.5 text-ink">{inquiry.productId ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-charcoal-800/8 px-3 py-2 dark:border-white/8">
          <dt className="font-medium text-ink-muted/70">IP address</dt>
          <dd className="mt-0.5 text-ink">{inquiry.ipAddress ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <label htmlFor={`note-${inquiry.id}`} className="block text-xs font-medium text-ink-muted">
          Internal note
        </label>
        <textarea
          id={`note-${inquiry.id}`}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={inputClass}
          placeholder="Only admins can see this"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!noteChanged || updateNote.isPending}
            onClick={() => updateNote.mutate({ id: inquiry.id, note: note.trim() || null })}
            className={secondaryButton}
          >
            {updateNote.isPending ? "Saving…" : "Save note"}
          </button>
          {updateNote.isError && (
            <span className="text-xs text-red-600 dark:text-red-400">Could not save the note.</span>
          )}
          {remove.isError && (
            <span className="text-xs text-red-600 dark:text-red-400">
              Could not delete the inquiry.
            </span>
          )}
          {updateStatus.isError && (
            <span className="text-xs text-red-600 dark:text-red-400">
              Could not update the status.
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function InquiriesPanel() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<InquiryStatus | "">("")
  const [page, setPage] = useState(1)

  const { data, isPending, isError, isFetching, refetch, error } = useAdminInquiries({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  })

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <section aria-labelledby="inquiries-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="inquiries-heading" className="text-lg font-semibold tracking-tight text-ink">
            Inquiries
          </h2>
          <p className="text-sm text-ink-muted">Contact form submissions from the public site.</p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className={secondaryButton}
        >
          <FiRefreshCw className={isFetching ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 sm:max-w-md">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, subject…"
            aria-label="Search inquiries"
            className={`${inputClass} mt-0 rounded-full`}
          />
          <button type="submit" className={secondaryButton}>
            Search
          </button>
        </form>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as InquiryStatus | "")
            setPage(1)
          }}
          aria-label="Filter inquiries by status"
          className={`${inputClass} mt-0 w-auto rounded-full`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {isPending ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-3xl" />
          ))
        ) : isError ? (
          <ErrorState
            title="Could not load inquiries"
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : data && data.data.length > 0 ? (
          data.data.map((inquiry) => <InquiryCard key={inquiry.id} inquiry={inquiry} />)
        ) : (
          <EmptyState
            title="No inquiries yet"
            description="Messages submitted through the contact form will appear here."
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
    </section>
  )
}
