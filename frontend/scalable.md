# Scalable Frontend Architecture — PashupatiPlasto

> Status: **approved plan** (written before implementation). The living, canonical doc after implementation is `ARCHITECTURE.md`. This file records the decisions and trade-offs made up-front.

**Stack:** React 19 · TypeScript (strict) · Vite 8 · Tailwind 4 · React Router 7 · TanStack Query · MSW · zod · vite-plugin-pwa (Workbox) · Vitest. Package manager: **npm**.

**Main problem:** everything loads at once. Fixed by (1) loading code/assets only when needed and (2) layering caches so repeat visits re-download almost nothing.

---

## 1. Folder tree

```
frontend/
├── index.html                  # preloads only critical fonts; no render-blocking 3rd-party CSS
├── vercel.json                 # cache headers (immutable assets, no-cache HTML)
├── public/
│   ├── fonts/                  # self-hosted, subsetted woff2 (via @fontsource)
│   └── images/                 # AVIF/WebP + compressed fallbacks (hero, logo, members)
├── scripts/
│   └── optimize-images.mjs     # one-time sharp conversion of public images
├── src/
│   ├── main.tsx                # entry: providers (ErrorBoundary → Query → Router), PWA, web-vitals
│   ├── app/
│   │   ├── router.tsx          # createBrowserRouter: lazy routes, Layout, 404, errorElement
│   │   ├── providers.tsx       # QueryClientProvider + client config
│   │   └── Layout.tsx          # skip-link, Navbar, <Outlet/>, Footer, MobileBottomNav, focus/scroll
│   ├── config/
│   │   ├── env.ts              # zod-validated import.meta.env (single access point)
│   │   └── site.ts             # BUSINESS single source of truth
│   ├── features/               # one folder per feature (the unit of ownership)
│   │   ├── home/               # Home page composition
│   │   ├── about/
│   │   ├── products/           # reference feature: api.ts + useProducts + skeleton + error
│   │   │   ├── api.ts          # feature-owned query fn + query keys
│   │   │   ├── useProducts.ts  # hooks wrapping TanStack Query
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductsGrid.tsx
│   │   │   └── index.ts        # barrel (public surface of the feature)
│   │   ├── contact/
│   │   ├── members/            # heavy carousel (lazy-loaded component)
│   │   ├── navbar/
│   │   └── footer/
│   ├── shared/
│   │   ├── ui/                 # Skeleton, RouteError, ErrorState, EmptyState, PageMeta, LazyImage
│   │   ├── hooks/              # usePrefetchRoute, useMediaQuery, …
│   │   ├── lib/                # motion presets, cn, webVitals
│   │   └── animation/          # shared stagger/fade variants (no cross-feature imports)
│   ├── services/               # ALL network I/O lives here
│   │   ├── http.ts             # single fetch client: baseURL, JSON, error normalization
│   │   ├── api.ts              # typed endpoints (getProducts, getMembers, submitContact)
│   │   ├── types.ts            # API DTOs
│   │   └── mock/               # MSW worker + handlers + data (dev only)
│   ├── i18n/                   # existing typed translation system (unchanged)
│   ├── styles/                 # index.css (Tailwind v4 tokens)
│   └── config-free-note:       # constants/* legacy data is re-exported/moved; no new code adds to it
└── tests/                      # Vitest + Testing Library
```

**Boundaries (enforced by ESLint `no-restricted-imports`):**

| From ↓ / To → | features/* | shared | services | config | i18n |
|---|---|---|---|---|---|
| `features/A` | only itself (relative) | ✅ | ✅ | ✅ | ✅ |
| `shared` | ❌ | itself | ❌ | ✅ | ✅ |
| `services` | ❌ | ❌ | itself | ✅ | ❌ |
| `app` | ✅ (lazy) | ✅ | ✅ | ✅ | ✅ |

Features never import each other. Shared code goes through `shared/`. A feature's public surface is its `index.ts` barrel.

---

## 2. Key decisions & trade-offs

| Decision | Why | Trade-off |
|---|---|---|
| **React 19 / Vite 8 / Tailwind 4** (not 18) | Already on latest; no reason to downgrade | — |
| **TanStack Query for all server state**; no Zustand | Marketing site has ~3 queries; a global store would be over-engineering | If complex client state appears later, add Zustand then — nothing blocks it |
| **MSW mocks** behind the same `services/api` interface | Real fetch layer is exercised in dev/tests; swapping to the real backend is a flag flip | Slight setup cost vs. static JSON |
| **vite-plugin-pwa** (Workbox) | Precache app shell; per-resource runtime strategies; built-in update flow | Plugin must track Vite major versions (fallback: raw `workbox-build`) |
| **Self-hosted subsetted fonts** (@fontsource) | Kills render-blocking Google Fonts request; `font-display: swap` built in; precached by SW | Must update fonts via npm, not Google Fonts URL |
| **manualChunks: `react-vendor` + `motion`** | framer-motion is the biggest vendor dep; keeping it out of the initial route chunk keeps first paint small | One extra request on first visit (cached after) |
| **Component-level lazy** for MembersSection | Below-fold, heavy, occasionally interacted with | Small skeleton flash on scroll into view |
| **Prefetch on hover/focus only** | Warms the next route without downloading everything eagerly | First click still waits if user doesn't hover (rare on desktop; instant on mobile tap→route anyway) |
| **Query defaults: staleTime 5 min, gcTime 30 min** | Marketing content rarely changes; near-zero repeat fetches | Content updates can lag ≤5 min (acceptable; invalidation rules below) |
| **Keep existing i18n** | Already solid and typed; touching it is out of scope | — |
| **No persistence layer (localStorage/IndexedDB) yet** | 3 queries don't justify the complexity; SW already serves as the offline cache | — |

---

## 3. Caching strategy (three layers)

### Layer 1 — HTTP cache (browser + CDN, via `vercel.json`)
| Resource | Cache-Control | Why |
|---|---|---|
| `/assets/*` (hashed JS/CSS/images) | `public, max-age=31536000, immutable` | Content-hashed filenames → never change meaning |
| Images in `/images/*` (hashed by build or SW) | `public, max-age=31536000, immutable` | Same |
| `/` and `/index.html` | `no-cache` | Must revalidate to pick up new hashed asset names |

### Layer 2 — Service worker (Workbox, via vite-plugin-pwa)
| Resource | Strategy | Rationale |
|---|---|---|
| Precache: app shell, JS, CSS, fonts | precache manifest | Instant boot, offline-capable |
| Images (`*.avif/webp/png/jpg`) | **CacheFirst**, 30-day expiry | Images rarely change; biggest byte savings |
| Hashed static (`/assets/*`) | **CacheFirst**, 30-day expiry | Hashed → safe to cache forever |
| `GET /api/*` | **StaleWhileRevalidate** | Serve cached instantly, refresh in background |
| Navigations / HTML | **NetworkFirst** (fallback: precached shell) | Always try fresh shell; offline → cached app |
| `POST/PUT/DELETE` | **NetworkOnly** | Never cache mutations |

**Update flow:** `registerType: 'prompt'` — a toast appears when a new SW is waiting: "New version available → Refresh". No auto-reload (avoids mid-read disruption).

### Layer 3 — Data cache (TanStack Query)
- `staleTime: 5 min`, `gcTime: 30 min`, `retry`: no retry on 4xx.
- Request deduplication is automatic (same query key = one in-flight request).
- Query key convention: `['<resource>', ...params]` e.g. `['products']`, `['products', id]`, `['members']`.
- Feature owns its keys in `features/<f>/api.ts`.

**Layer interaction:** the SW may serve a cached `/api` response while TanStack Query decides whether that data is *fresh enough* to display without refetching. Query's `staleTime` is the freshness source of truth; the SW is the offline/instant-byte source of truth.

### Cache invalidation rules
| What | When invalidated | How | Why |
|---|---|---|---|
| `['products']` | Admin edits products (future) | `queryClient.invalidateQueries({ queryKey: ['products'] })` after mutation | 5-min staleTime would otherwise show old data |
| `['members']` | Team page updated (future) | same pattern | same |
| Static assets (`/assets/*`) | Never manually | New build = new hash = new URL | `immutable` is safe only because of hashing |
| `index.html` | Every navigation (browser revalidates) | `no-cache` header | Must discover new asset hashes |
| SW precache | New deploy | Workbox activates new precache; prompt shown to user | Controlled update, no surprise reloads |
| SW runtime caches (images/API) | Version bump or 30-day expiry | Cache name includes SW version; old caches deleted on activate | Avoid stale-forever images across deploys |

---

## 4. Load-on-demand rules

1. **Route level:** every page is `React.lazy` → separate chunk. Fallback = page skeleton (never a bare spinner).
2. **Component level:** lazy-load anything below-the-fold, heavy, or rarely used (modals, charts, carousels). Reference: `MembersSection`.
3. **Images:** `LazyImage` wrapper → `loading="lazy"` (except LCP hero: `eager` + `fetchpriority="high"`), `srcset`+`sizes`, AVIF/WebP, explicit `width/height` (no CLS).
4. **Third-party scripts/libraries:** dynamic `import()` at the point of need (none currently required; the pattern is documented in `ARCHITECTURE.md`).
5. **Prefetch:** nav links call `usePrefetchRoute(path)` on `onMouseEnter`/`onFocus`. Never prefetch all routes at once.
6. **Fonts:** self-hosted subsets; only the two critical woff2 files preloaded in `index.html`; everything else loads async with `font-display: swap`.
7. **Vendor split:** `react-vendor` (react, react-dom, router) and `motion` (framer-motion) are separate manual chunks so the initial route chunk stays small.

---

## 5. State management guidance
- **Server state → TanStack Query** (products, members, anything from `/api`).
- **Local UI state → `useState`/`useRef`** (open/closed, hovered index, form field values).
- **Shared client state → only if truly cross-feature** (currently: theme + language, already handled by existing context + localStorage). A new store (Zustand) is justified only when ≥2 features need the same *mutable* client state that isn't server data. Nothing else.

---

## 6. Quality guardrails
- TS `strict` + `noUncheckedIndexedAccess`; path alias `@/* → src/*`.
- ESLint: module boundaries (`no-restricted-imports`), react-hooks, react-refresh. (Type-aware lint intentionally deferred — would flood pre-existing code with fixes.)
- Prettier (staged files only via lint-staged; no mass reformat).
- Performance budget: **initial JS < 170 KB gzipped**. `npm run analyze` (rollup-plugin-visualizer) to inspect.
- Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms. `web-vitals` reports in `main.tsx`.
- Tests: Vitest + Testing Library (util, hook, component examples).

---

## 7. How to add a new feature (cheatsheet)
1. `src/features/<name>/` — components, hooks, `api.ts` (query fn + keys), `index.ts` barrel.
2. If it needs data: add typed endpoint in `src/services/api.ts` + handler in `src/services/mock/handlers.ts`.
3. Add a lazy route in `src/app/router.tsx`: `lazy: () => import('@/features/<name>')`.
4. Add a query key in the feature's `api.ts`. Invalidate on relevant mutations.
5. Use `shared/ui` skeletons + error states. Never import another feature.

## 8. How to connect the real backend later
1. Set `VITE_API_MODE=live` and `VITE_API_BASE_URL=https://api.example.com` in `.env`.
2. Delete/stop the MSW worker (it only starts in `mock` mode).
3. **No feature or component changes** — they already call `services/api`.
4. Ensure the backend sends CORS headers for the frontend origin (NestJS: enable CORS in `main.ts`).

---

## 9. Baseline (before) vs target (after)
| Metric | Before | Target |
|---|---|---|
| Initial JS (gzip) | **139.77 kB** (1 chunk: 441.29 kB raw) | < 170 kB gzip, **split** into `react-vendor` + `motion` + small per-route chunks |
| Route chunks | 0 (all eager) | 1 per page + 1 per lazy component |
| Repeat-visit network | full re-download | ~0 (SW precache + immutable headers + staleTime) |
| Hero image | 1.75 MB PNG | AVIF/WebP, ~tens of KB, lazy/eager per LCP role |
| Fonts | render-blocking Google Fonts CSS | self-hosted, preloaded critical only, `font-display: swap` |
