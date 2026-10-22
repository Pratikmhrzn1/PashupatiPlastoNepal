# ARCHITECTURE.md — Pashupati Plasto Frontend

Canonical living document. The pre-implementation proposal lives in `scalable.md`.

**Stack:** React 19 · TypeScript (strict) · Vite 8 · Tailwind 4 · React Router 7 · TanStack Query · MSW · zod (`zod/v4/mini`) · vite-plugin-pwa (Workbox) · Vitest. Package manager: **npm**. Deploy target: **Vercel**.

---

## 1. Folder structure

```
frontend/
├── index.html                  # preloaded critical fonts, no render-blocking 3rd-party CSS
├── vercel.json                 # Cache-Control headers (see §5)
├── public/
│   ├── fonts/                  # self-hosted subsetted woff2 (Poppins latin, Noto Devanagari)
│   ├── images/                 # AVIF/WebP + compressed PNG fallbacks (hero, logo, member)
│   └── mockServiceWorker.js    # MSW worker (generated; git-ignored by ESLint)
├── scripts/
│   └── optimize-images.mjs     # one-time sharp conversion (npm run not wired; run manually)
├── src/
│   ├── main.tsx                # entry: AppErrorBoundary → LanguageProvider → MotionConfig → App; MSW + web-vitals bootstrap
│   ├── app/
│   │   ├── App.tsx             # QueryClientProvider + RouterProvider
│   │   ├── router.tsx          # createBrowserRouter: lazy routes, Layout, 404, errorElement
│   │   ├── routes.ts           # route lazy-import registry (also used for hover prefetch)
│   │   ├── usePrefetchRoute.ts # hover/focus prefetch hook
│   │   ├── Layout.tsx          # skip-link, Navbar, <Outlet/>, Footer, MobileBottomNav, focus mgmt, ScrollRestoration
│   │   └── queryClient.ts      # QueryClient defaults (staleTime/gcTime/retry)
│   ├── config/
│   │   ├── env.ts              # zod-validated import.meta.env (VITE_API_MODE, VITE_API_BASE_URL)
│   │   └── site.ts             # BUSINESS single source of truth
│   ├── features/               # one folder per feature
│   │   ├── products/           # REFERENCE FEATURE: api.ts + useProducts/useFeaturedProducts + grid/card/featured section + barrel
│   │   ├── hero/  members/  navbar/  footer/
│   ├── pages/                  # route page components (composition layer — may import features)
│   │   ├── Home.tsx  About.tsx  Products.tsx  Contact.tsx
│   ├── shared/
│   │   ├── ui/                 # Skeleton, PageSkeleton, ProductGridSkeleton, RouteError (+AppErrorBoundary), PageMeta, NotFound, States (Empty/Error), LazyImage
│   │   ├── hooks/              # useMediaQuery, useActiveSection
│   │   ├── lib/                # motion presets, webVitals
│   │   └── floating/           # FloatingContactButton
│   ├── services/               # ALL network I/O
│   │   ├── http.ts             # single fetch client: baseURL, JSON, ApiError normalization
│   │   ├── api.ts              # typed endpoints (getProducts, getMembers, submitContact)
│   │   ├── types.ts            # wire DTOs (ProductDto, MemberDto, ContactPayload…)
│   │   └── mock/               # MSW: browser.ts (worker), handlers.ts, data.ts
│   ├── i18n/                   # typed EN/NE translations (unchanged legacy system)
│   ├── constants/              # legacy static data (products/members now also available via API/mocks)
│   └── styles/ (index.css)     # Tailwind v4 tokens + self-hosted @font-face
└── tests/                      # Vitest: translate.test.ts, usePrefetchRoute.test.tsx, ProductCard.test.tsx
```

## 2. Module boundaries (enforced by ESLint `no-restricted-imports`)

| From ↓ / To → | features/* | shared | services | config | i18n | app | pages |
|---|---|---|---|---|---|---|---|
| `features/A` | only itself (relative) | ✅ | ✅ | ✅ | ✅ | ✅ (router helpers) | ❌ |
| `pages` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | itself |
| `shared` | ❌ | itself | ❌ | ✅ | ✅ | ❌ | ❌ |
| `services` | ❌ | ❌ | itself | ✅ | ❌ | ❌ | ❌ |
| `app` | ✅ (lazy) | ✅ | ✅ | ✅ | ✅ | itself | ✅ (lazy) |

- Features never import each other. A feature's public surface is its `index.ts` barrel.
- `pages/` is the composition layer: it may import multiple features to build a route.
- Within a feature, use relative imports (`./ProductCard`) so cross-feature `@/features/*` imports are unambiguously detectable.

## 3. Load-on-demand

1. **Route level:** every page is lazy via `routes.ts` + RR7 `lazy:`. Layout renders `<Suspense fallback={<PageSkeleton/>}>` (skeletons, never bare spinners).
2. **Component level:** heavy below-fold components use `React.lazy` (e.g. `MembersSection` in Home).
3. **Images:** `LazyImage` / `<picture>` with AVIF→WebP→PNG, `srcset`+`sizes`, explicit `width/height` (CLS=0). LCP hero is `fetchPriority="high"` + eager; everything else `loading="lazy"`.
4. **Third-party:** dynamically imported at point of need (e.g. `web-vitals` in `reportWebVitals`).
5. **Prefetch:** nav links call `usePrefetchRoute(path)` on `onMouseEnter`/`onFocus` — one route at a time, never all.
6. **Fonts:** self-hosted subsets; only Poppins 400 + 600 preloaded; 500/700 + Devanagari load async via `unicode-range` + `font-display: swap`.
7. **Manual chunks:** `react-vendor` (react, react-dom, react-router), `motion` (framer-motion), `vendor` (tanstack, zod-mini, icons).

## 4. Data layer & caching

### TanStack Query
- Defaults in `app/queryClient.ts`: `staleTime: 5 min`, `gcTime: 30 min`, no retry on 4xx, `refetchOnWindowFocus: false`.
- Key convention: `['<resource>', ...params]`, defined in the owning feature's `api.ts` (`productKeys.list()`, `productKeys.detail(id)`).
- Request deduplication: automatic (same key = one in-flight request).

### Service worker (vite-plugin-pwa, Workbox)
| Resource | Strategy | Notes |
|---|---|---|
| Precache: JS/CSS/HTML/fonts | precache manifest | app shell; update prompt ("New version → Refresh") |
| Images (`/images/*`, img destination) | CacheFirst, 30d | runtime-cached on first use (not precached) |
| `GET /api/*` | StaleWhileRevalidate, 1d | instant serve + background refresh |
| Navigations | NetworkFirst (3s timeout) | offline → precached shell |
| Mutations | NetworkOnly | never cached |

`registerType: "prompt"` — no auto-reload; a toast asks the user to refresh. `cleanupOutdatedCaches: true` removes stale runtime caches on new SW versions.

### HTTP cache (Vercel, `vercel.json`)
- `/assets/*` (content-hashed): `public, max-age=31536000, immutable`
- `/fonts/*` (vendored, stable names): `public, max-age=31536000, immutable`
- `/images/*` (not hashed): `public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400`
- `/` and `/index.html`: `no-cache` (must revalidate to discover new hashed assets)

### Cache invalidation rules
| What | When | How |
|---|---|---|
| `['products']` / `['members']` | after a future admin mutation | `queryClient.invalidateQueries({ queryKey: productKeys.all })` |
| Hashed `/assets/*` | never manually | new build = new URL |
| `index.html` | every navigation | `no-cache` revalidation |
| SW precache | new deploy | Workbox new manifest; user prompted to refresh |
| SW runtime caches | new SW version | `cleanupOutdatedCaches` + versioned cache names |
| API SWR cache | every GET revalidation | background fetch overwrites cached copy |

## 5. Conventions

- **State:** server → TanStack Query; local UI → `useState`; shared mutable client state → context (theme/lang) or a store only when ≥2 features share it (not needed today).
- **Errors:** every route has `errorElement={<RouteError/>}`; `AppErrorBoundary` wraps the app for non-router errors; `ApiError` normalizes all network failures.
- **Loading/empty/error UI:** `Skeleton`/`ProductGridSkeleton`, `EmptyState`, `ErrorState` (with retry) from `shared/ui/States` + `shared/ui/Skeleton`.
- **Meta/SEO:** `PageMeta` per route (title + description). Focus moves to `<main>` on every route change; skip-link present.
- **i18n:** `useLanguage().t("dotted.key")` — keys are type-inferred from `translations.json`. Add keys there.
- **Images:** run `node scripts/optimize-images.mjs` after replacing source images in `public/`.
- **Env:** never read `import.meta.env` outside `config/env.ts`.

## 6. How to add a new feature (checklist)

1. Create `src/features/<name>/` with components, hooks, `api.ts` (query keys + fns), `index.ts` barrel.
2. If it needs data: add a typed endpoint in `src/services/api.ts` + an MSW handler in `src/services/mock/handlers.ts` (+ data in `data.ts`).
3. Create `src/pages/<Name>.x` composing the feature; add `PageMeta`.
4. Register in `src/app/routes.ts` (`"/<name>": () => import("@/pages/<Name>")`) and in `src/app/router.tsx` (child route with `lazy:` using `getRouteLoader`).
5. Add nav link in `src/constants/navLinks.ts` if it should appear in navigation (hover-prefetch comes free via `NavLinks`).
6. Use `shared/ui` skeletons/states; never import another feature.

## 7. Connecting the real backend

1. Deploy the NestJS backend and enable CORS for the frontend origin.
2. In Vercel project env vars: set `VITE_API_MODE=live` and `VITE_API_BASE_URL=https://api.example.com`.
3. Remove the MSW dynamic import in `src/main.tsx` (and optionally delete `src/services/mock/`). Nothing else changes — features call `services/api` which calls `http` which uses `apiBaseUrl()`.
4. Keep the same DTO shapes in `src/services/types.ts` or update them once, centrally.

## 8. Performance budget & measurement

- **Initial JS budget:** ~170 KB gzipped (react-vendor + motion + vendor + index). Run `npm run build` and sum the gzip sizes of those four chunks; `npm run analyze` opens a treemap (`dist/stats.html`).
- **Web Vitals:** `reportWebVitals()` logs LCP/CLS/INP in dev; wire the callback to an analytics beacon when available. Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.

## 9. Testing

- `npm run test` (Vitest + jsdom + Testing Library).
- Layers covered in `tests/`: util (`translate`), hook (`usePrefetchRoute`), component (`ProductCard`).
- MSW handlers are available for integration tests via `services/mock/handlers.ts`.

## 10. Bundle size: before → after

| | Before | After |
|---|---|---|
| **Initial JS (gzip)** | **139.77 KB** — one chunk `index.js` (441.29 KB raw) containing every page + all vendors | **~173 KB** across 4 chunks: `react-vendor` 96.62 + `motion` 48.86 + `vendor` 20.07 + `index` 7.69 (gzip) |
| Route chunks | 0 (all 4 pages eager) | About 0.54 · Home 1.48 · Contact 0.96 · Products 2.36 · NotFound 0.49 (gzip) |
| Lazy components | 0 | members carousel 3.35 KB gz (own chunk) |
| Hero image | 1.75 MB PNG (single size) | 96 KB AVIF / 201 KB WebP @1024w · 59 KB AVIF @640w, responsive `srcset` |
| Logo (nav/footer/favicon) | 1.35 MB PNG | 1.2 KB WebP (nav) · 3.6 KB PNG (favicon) |
| Fonts | render-blocking Google Fonts stylesheet (~100+ ms RTT before first paint) | self-hosted woff2, 2×8 KB preloaded, rest async, `font-display: swap` |
| Repeat visit (static) | full re-download | ~0 — SW precache + `immutable` headers |
| Repeat visit (data) | re-fetched every mount | 0 within 5-min `staleTime` |
| Added dependencies | — | TanStack Query (~13 KB gz), zod-mini (~4 KB gz), PWA runtime (~1 KB), MSW (dev-only, tree-shaken from prod) |

**Net:** the after-initial bundle is ~33 KB gz heavier because it now includes a real data layer (TanStack Query), env validation (zod), and the PWA runtime that didn't exist before — but it buys route-level splitting (each page ≤2.4 KB gz incremental), near-zero repeat visits, and offline capability. The dominant cost is `react-dom` + `react-router` + `framer-motion` (used by the persistent Navbar/Footer shell), which is irreducible without rewriting those features off framer-motion.
