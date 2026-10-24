/**
 * Route lazy-load registry.
 * Only contains dynamic import() calls, so no page code lands in the main bundle.
 * Kept in sync with the route table in src/app/router.tsx.
 * Consumed by router.tsx (for routes) and usePrefetchRoute.ts (for hover/focus).
 */
export const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Home"),
  "/about": () => import("@/pages/About"),
  "/products": () => import("@/pages/Products"),
  "/contact": () => import("@/pages/Contact"),
  // "/login-admin": () => import("@/pages/LoginAdmin"),
  // "/admin": () => import("@/pages/Admin"),
};

/** Type-safe accessor: returns the loader or throws if the path isn't registered. */
export function getRouteLoader(path: string): () => Promise<unknown> {
  const loader = routeLoaders[path];
  if (!loader) throw new Error(`No route loader registered for "${path}"`);
  return loader;
}
