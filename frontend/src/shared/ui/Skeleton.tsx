interface SkeletonProps {
  className?: string;
}

/** Generic shimmering skeleton block. Compose with layout containers. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-charcoal-800/10 dark:bg-white/10 ${className}`}
    />
  );
}

/** Full-page skeleton used as a React.lazy / Suspense fallback for routes. */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas px-6 pt-28 pb-20 sm:pt-32">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-1/2 max-w-lg" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-4/3 w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Grid skeleton matching the products grid shape (used by the products feature). */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-label="Loading products"
      aria-busy="true"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-4/3 w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
