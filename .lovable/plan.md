# EduBari — Performance, Load Time & Bundle Size Optimization Plan

লক্ষ্য: Lighthouse Performance **৯২ → ৯৮+**, LCP **১.৪s → < ১.০s**, Initial JS **১৩০ KB → < ৮৫ KB**, TTI **২s → < ১.৩s**।

৬টা phase এ ভাগ করা — প্রতিটা independently shippable, কোনোটাই app break করবে না।

---

## Phase 1 — Image Pipeline (সবচেয়ে বড় win, LCP −৪০%)

বইয়ের cover image-ই LCP element। এখনো original JPEG/PNG সরাসরি serve হচ্ছে।

1. **`vite-imagetools`** install — bundled asset (`@/assets/*`) এর জন্য build-time WebP/AVIF variant generate।
2. **Reusable `<BookCover />` component** — `<picture>` tag দিয়ে AVIF → WebP → JPEG fallback, plus `srcset` (320w, 480w, 768w) এবং `sizes` attribute।
3. **Supabase Storage bucket image transform** — user-uploaded book cover এর জন্য `?width=400&quality=75&format=webp` query string (Supabase image transformation built-in)।
4. **Explicit `width`/`height`** সব `<img>` এ — CLS শূন্য রাখার জন্য।
5. **LCP image preload** — homepage এর first 4 book cover route-এর `head().links` এ `rel="preload" as="image" fetchpriority="high"`।
6. **Lazy load + blur placeholder** — fold এর নিচের image এ `loading="lazy"` + low-quality LQIP।

Expected: LCP ১.৪s → ০.৮s, total image weight −৬৫%।

---

## Phase 2 — Bundle Splitting & Tree Shaking (Initial JS −৩৫%)

1. **Manual vendor chunks** `vite.config.ts` এ:
   - `react-vendor` (react, react-dom)
   - `router-vendor` (tanstack/router, tanstack/start)
   - `query-vendor` (tanstack/query)
   - `ui-vendor` (radix-ui primitives)
   - `form-vendor` (rhf + zod) — only on form routes
2. **Route-level code split verification** — admin, dashboard, checkout আলাদা chunk হচ্ছে কিনা `bun run build` output চেক।
3. **Lucide icon tree-shaking audit** — `import { Eye, Star } from "lucide-react"` ঠিক আছে, কিন্তু barrel import (`import * as Icons`) থাকলে fix।
4. **Date library swap** — যদি `date-fns` full import থাকে, individual function import (`date-fns/format`) করা; অথবা lightweight `dayjs` (৭ KB)।
5. **Remove unused shadcn components** — `src/components/ui/` এ যেগুলো কখনো import হয় না (carousel, menubar, resizable ইত্যাদি) delete।
6. **Dynamic import** ভারী admin-only library (TanStack Table, recharts) — শুধু admin route এ load।

Expected: main bundle ৮৫ KB → ৫৮ KB।

---

## Phase 3 — Data Fetching Performance (TTI −৩০%)

1. **Loader-based prefetch** — route loader এ `context.queryClient.ensureQueryData(booksQueryOptions)` যাতে component render হওয়ার আগেই data ready।
2. **`defaultPreloadStaleTime`** ৩০s set — `<Link preload="intent">` hover এ instant navigation।
3. **Pagination + cursor-based query** — `/books` route এ `limit(20)` + infinite scroll, এখন একসাথে সব published book fetch হয়।
4. **Select specific columns** — `select('id, title, author, price, cover_url, rating')` instead of `select('*')` for list views; full data শুধু detail page এ।
5. **`React.cache` / Query staleTime tuning** — books list staleTime ৩০s → ৫ min, কারণ realtime invalidation আছে।
6. **Database index** — `books(is_published, created_at DESC)` composite index migration।

Expected: books query payload −৭০%, TTI ২s → ১.৩s।

---

## Phase 4 — Critical Rendering Path (FP −৩০%)

1. **Font subsetting** — Bangla + Latin আলাদা subset, `font-display: swap`, preconnect to font CDN।
2. **Inline critical CSS** — above-the-fold CSS inline, rest async load (TanStack Start ইতিমধ্যে handle করে, verify only)।
3. **Defer non-critical scripts** — analytics, Sentry, chat widget সব `defer` বা post-load।
4. **Remove render-blocking** — Google Fonts CSS preload + `media="print" onload` trick।
5. **HTTP/2 Push hints** — `<link rel="modulepreload">` critical route chunks এর জন্য।

Expected: First Paint ৭০০ms → ৪৫০ms।

---

## Phase 5 — Caching & Network (Repeat visit instant)

1. **Cloudflare cache headers** — static asset (image, font, JS) এ `Cache-Control: public, max-age=31536000, immutable`।
2. **Service Worker / PWA** — `vite-plugin-pwa` দিয়ে precache shell + runtime cache (StaleWhileRevalidate for API)।
3. **HTML caching** — SSR HTML এ short TTL (`s-maxage=60, stale-while-revalidate=300`)।
4. **CDN for Supabase Storage** — Cloudflare R2 / Supabase Storage CDN endpoint।
5. **Brotli compression** — Cloudflare auto, verify enabled।

Expected: Repeat visit < ৩০০ms (cached)।

---

## Phase 6 — Runtime Performance (Smooth interactions)

1. **`React.memo` + `useMemo`** — book card list, cart item list (১০০+ item এ measurable)।
2. **Virtualization** — admin tables (books, orders) এ `@tanstack/react-virtual` যখন rows > ১০০।
3. **Debounce search input** — admin search, books filter এ ৩০০ms debounce।
4. **Optimistic updates** — cart add/remove, wishlist toggle এ `useMutation` optimistic update।
5. **Suspense + streaming** — slow query গুলো `<Suspense>` boundary এ wrap, partial render।

Expected: INP < ২০০ms, scroll FPS ৬০।

---

## Suggested execution order

**Recommended: Phase 1 + 2 first** — সবচেয়ে বড় visible impact, ২–৩ ঘণ্টায় shipable।  
তারপর Phase 3 (data) → Phase 5 (cache) → Phase 4 (CRP) → Phase 6 (runtime polish)।

---

## Measurement (প্রতি phase শেষে)

প্রতিটা phase deploy এর পর verify:
- `bun run build` output (bundle size diff)
- Chrome DevTools Lighthouse (mobile, throttled 4G)
- WebPageTest.org (real-world LCP, TTI)
- Browser DevTools Performance profile (long task identification)

Baseline এর সাথে before/after table report এ যোগ হবে।

---

## কোনটা দিয়ে start করব?

জবাব দিন:
- **"phase 1"** → Image pipeline শুরু
- **"phase 1+2"** → Image + Bundle (recommended quick win)
- **"all"** → সব phase একে একে order অনুযায়ী
- **specific phase number(s)** → শুধু সেটা/সেগুলো
