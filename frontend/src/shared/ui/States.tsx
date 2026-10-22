interface EmptyStateProps {
  title: string;
  description?: string;
}

/** Consistent empty-state pattern: used when a list/query returns no items. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-charcoal-800/15 px-6 py-16 text-center dark:border-white/10">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="max-w-md text-sm text-ink-muted">{description}</p>}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Consistent error-state pattern: message + optional retry action. */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-800/15 bg-red-50/50 px-6 py-16 text-center dark:border-red-400/20 dark:bg-red-950/20"
    >
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="max-w-md text-sm text-ink-muted">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
