import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient with site-wide defaults.
 * - staleTime 5 min: marketing data rarely changes; repeat visits skip refetches.
 * - gcTime 30 min: keep unused data around long enough for back/forward nav.
 * - No retry on 4xx (client errors won't fix themselves).
 *
 * Query key convention: ['<resource>', ...params]. Invalidation rules are
 * documented in ARCHITECTURE.md.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
