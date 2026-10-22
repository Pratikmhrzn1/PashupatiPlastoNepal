import { useCallback } from "react";
import { routeLoaders } from "./routes";

/**
 * Returns handlers that prefetch a route's chunk on hover/focus.
 * Usage: <Link {...usePrefetchRoute("/products").handlers} to="/products">…
 *
 * Never prefetches more than the one route you target — no bulk preloading.
 * Unknown paths are silently ignored (prefetch is an optimization, never a crash).
 */
export function usePrefetchRoute(path: string) {
  const prefetch = useCallback(() => {
    const loader = routeLoaders[path];
    if (loader) void loader();
  }, [path]);

  const handlers = {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  };

  return { handlers };
}
