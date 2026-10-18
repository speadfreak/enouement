# Performance — ENOUEMENT 2K27

Baseline + performance budget notes for the bundle / ISR / cache work
landed in task **U6-BUNDLE-CACHE**. Updated whenever the caching
strategy or bundle shape changes.

---

## 1. Bundle diet

### Bundle analyzer

`@next/bundle-analyzer` is installed as a devDependency. Run:

```bash
bun run analyze      # equivalent to: ANALYZE=true next build
```

This produces interactive treemap reports under `.next/analyze/` for
both the **client** and **server** bundles. Open `client.html` first —
it's the file that ships to users on first paint.

### `optimizePackageImports`

`next.config.ts` enables `experimental.optimizePackageImports` for:

- `lucide-react` — icon lib (huge surface, ~5 KB per icon used)
- `framer-motion` — animation lib
- `date-fns` — date utils (modular already, but pinned for safety)
- `recharts` — chart lib (admin-only, but listed so the tree-shake
  also covers any future public-page usage)
- `@radix-ui/react-*` — every primitive the project uses (24 packages)

This forces Next/Turbopack to transform per-symbol imports so unused
icons/components are dropped from the graph entirely. Without it, the
shadcn/ui barrel re-export pattern can pull in 100+ KB of unused code.

### Heavy admin-only libs — code-split verification

The following libs are **admin-only** and must never ship to a public
page bundle. Verified by grep — none are imported by any file outside
`src/app/admin/**` or `src/components/admin/**`:

| Library                    | Used in                  | Public-page risk |
| -------------------------- | ------------------------ | ---------------- |
| `react-syntax-highlighter` | admin post editor        | none             |
| `@mdxeditor/editor`        | admin post editor        | none             |
| `recharts`                 | `src/components/ui/chart.tsx` (orphan) | none |
| `@dnd-kit/*`               | admin sortable lists     | none             |
| `embla-carousel-react`     | `src/components/ui/carousel.tsx` (orphan) | none |
| `three` / `@react-three/*` | `src/components/hero/hero-scene.tsx` | dynamic-imported `ssr:false` from `hero.tsx` |

`three` + `@react-three/fiber` + `@react-three/drei` are loaded via:

```ts
const HeroScene = dynamic(
  () => import("./hero-scene").then((m) => m.HeroScene),
  { ssr: false, loading: () => null }
);
```

This means:
- They never ship to the **server** bundle (SSR is disabled).
- They never ship to the **initial client** JS (loaded on demand).
- They are excluded from the page's first-paint critical path.

### Orphan UI primitives

`src/components/ui/chart.tsx` (recharts wrapper) and
`src/components/ui/carousel.tsx` (embla wrapper) are present but not
imported by any public or admin page today. They are tree-shaken out
of every bundle. They exist for shadcn/ui completeness — leave them in
place unless we are certain they will never be needed.

---

## 2. ISR + caching

### Public page `revalidate` exports

Each public route exports a `revalidate` constant that caps how long a
statically-rendered page is served before regeneration:

| Route           | `revalidate` | Backing cached reads             |
| --------------- | ------------ | -------------------------------- |
| `/` (home)      | `300`        | `site`, `hero`, `posts`, `announcements`, `events`, `stats` |
| `/story`        | `60`         | `story`                          |
| `/moments`      | `60`         | `posts` (RSC seed); client polls `/api/posts/latest` every 15s |
| `/gallery`      | `60`         | `albums`                         |
| `/seniors`      | `60`         | `students` (paginated), `students` stats |
| `/events`       | `60`         | `events`                         |
| `/announcements`| `60`         | `announcements`                  |
| `/graduation`   | `60`         | `graduation`, `students`         |
| `/merch`        | `60`         | `merch`                          |
| `/videos`       | `60`         | `videos`                         |
| `/contact`      | `60`         | `site`                           |

The page-level `revalidate` is an **upper bound**. The underlying
`unstable_cache` reads may revalidate more frequently — for example
`getPosts` revalidates every 30s, but `/moments` only re-renders at
most every 60s. That's intentional: the page is the slow part, and
the client-side `/api/posts/latest` poll closes the gap below 60s.

### `unstable_cache` tags + TTLs

All public read helpers in `src/lib/data.ts` are wrapped with
`unstable_cache`. Each helper declares a stable tag and a TTL:

| Helper                   | Tag             | `revalidate` (s) |
| ------------------------ | --------------- | ---------------- |
| `getSite`                | `site`          | `300`            |
| `getNavLinks`            | `nav`           | `300`            |
| `getHeroMedia`           | `hero`          | `60`             |
| `getStoryChapters`       | `story`         | `300`            |
| `getPosts`               | `posts`         | `30`             |
| `getAlbums`              | `albums`        | `60`             |
| `getMerch`               | `merch`         | `300`            |
| `getAnnouncements`       | `announcements` | `60`             |
| `getEvents`              | `events`        | `60`             |
| `getGraduation`          | `graduation`    | `300`            |
| `getStudents`            | `students`      | `60`             |
| `getStudentsPaginated`  | `students`      | `60`             |
| `getStudentStats`        | `students`      | `60`             |
| `getVideos`              | `videos`        | `60`             |
| `getStats`               | `stats`         | `60`             |
| `getDeveloperLinks`      | `dev-links`     | `300`            |

Single-record lookups (`getAnnouncement(slug)`, `getEvent(slug)`)
are intentionally not cached — they're only used inside dynamic
`/announcements/[slug]` and `/events/[slug]` routes, where ISR
caching at the page layer is sufficient.

### Select optimizations

`getPosts`, `getStudents`, and `getStudentsPaginated` use `.select()`
to project only the fields the UI actually renders. This shrinks the
DB → RSC payload meaningfully on the largest lists:

- **Posts**: id, caption, tags, mediaUrls, mediaType, pinned, published,
  authorName, likeCount, createdAt — drops `updatedAt`, `slug`, etc.
- **Students (full list)**: id, name, photoUrl, nickname, section,
  stream, club, quote, futurePlan, featured, order — drops `bio`,
  `updatedAt`, etc.

### `layout.tsx` metadata

`generateMetadata()` in `src/app/layout.tsx` calls `getSite()` —
which is now cached (tag `site`, 300s TTL). Previously this fired a
Prisma query on every single page navigation. Now it hits the
in-memory + Data Cache for 5 minutes between revalidations.

---

## 3. Admin saves → instant revalidation

Every mutation in `src/app/api/admin/**/route.ts` calls
`revalidateTag(tag, "max")` from `next/cache` for the relevant
tag(s). The second `"max"` argument is required by Next.js 16's
new signature; it tells Next to use the maximum cache lifespan
profile for the regenerated entry, but for `unstable_cache` entries
the original `revalidate` setting (e.g. `30s` for posts) still
controls auto-revalidation.

Mapping (one row per resource; multiple revalidateTag calls per
route when listed):

| Resource                | Tags invalidated                                  |
| ----------------------- | ------------------------------------------------- |
| Site settings           | `site`, `nav` (+ `revalidatePath("/", "layout")`) |
| Hero media              | `hero`                                            |
| Story chapters          | `story`                                           |
| Posts                   | `posts`, `stats`                                  |
| Albums                  | `albums`                                          |
| Album media (single)    | `albums`                                          |
| Album media (bulk)      | `albums`                                          |
| Album media (bulk-del)  | `albums`                                          |
| Announcements           | `announcements`                                   |
| Events                  | `events`                                          |
| Graduation              | `graduation`                                      |
| Videos                  | `videos`                                          |
| Students (single)       | `students`, `stats`                               |
| Students (bulk create)  | `students`, `stats`                               |
| Students (bulk update)  | `students`, `stats`                               |
| Developer links         | `dev-links`                                       |
| Footer (dev credit)     | `site`                                            |
| Merch                   | `merch`                                           |

Routes that are pure mutations on admin-only resources (users,
contact messages, change-password) do **not** call `revalidateTag`
because their data is never cached or shown on public pages.

---

## 4. Moments feed polling

`src/components/moments/feed.tsx` previously polled
`/api/posts?limit=20` every 20s unconditionally. It now uses a
two-stage strategy:

1. **Lightweight signature poll** every **15s** against
   `/api/posts/latest`. This endpoint returns ~80 bytes
   (`{ latestId, latestCreatedAt, latestPinned, count }`) and is
   cacheable at the CDN edge for 10s.
2. **Full first-page fetch** only when the signature differs from
   what the feed already has rendered. This is the
   `/api/posts?limit=20` call that fills the "N new moments" pill.

Both polls are **gated** by two conditions:

- `document.visibilityState === "visible"` — paused when the tab is
  backgrounded (saves battery + data on mobile, kills phantom
  polling on idle desktops).
- `IntersectionObserver` on the feed container — paused when the
  user has scrolled away to the footer or another section.

When either gate is false, `refetchInterval` returns `false`
(react-query's "pause" signal). When both become true again, the
next tick fires immediately and resumes the 15s cadence.

### Net effect

- Idle/background tabs: 0 requests/min (was 3 req/min × ~50 KB).
- Active tab, feed scrolled out of view: 0 requests/min.
- Active tab, feed in view: 4 lightweight polls/min × ~80 bytes +
  1 heavy fetch only when new content exists.

---

## 5. Performance budget (initial targets)

These are the targets the bundle analyzer + Lighthouse should hit on a
fresh production build with the home page (`/`) as the test URL.

### First-load JS (per-route, gzipped, mobile-class connection)

| Route           | Budget | Notes |
| --------------- | ------ | ----- |
| `/` (home)      | < 220 KB | Hero scene is dynamic ssr:false so it's excluded from initial JS. |
| `/story`        | < 130 KB | Pure RSC + framer-motion timeline. |
| `/moments`      | < 180 KB | Adds react-query + lightbox. |
| `/gallery`      | < 160 KB | Masonry layout. |
| `/seniors`      | < 180 KB | Paginated grid + filters. |
| `/events`       | < 150 KB | Calendar (react-day-picker). |
| `/announcements`| < 140 KB | Filter chips + grid. |
| `/graduation`   | < 170 KB | Countdown + wall of seniors. |
| `/merch`        | < 150 KB | Showcase + dialogs. |
| `/videos`       | < 150 KB | Video grid + player dialog. |
| `/contact`      | < 130 KB | Form + info cards. |

### Server bundle (Next.js standalone server)

- Excludes `three`, `@react-three/*` (dynamic ssr:false).
- Excludes `recharts`, `@mdxeditor/editor`, `react-syntax-highlighter`,
  `@dnd-kit/*` (admin-only, lazy-loaded by admin client components).
- Target: < 4 MB total server bundle.

### Lighthouse (mobile, throttled 4G, mid-tier Android)

| Metric        | Target  | Stretch |
| ------------- | ------- | ------- |
| LCP           | < 2.5s  | < 1.8s  |
| FID / INP     | < 200ms | < 100ms |
| CLS           | < 0.1   | < 0.05  |
| TBT           | < 300ms | < 150ms |
| Speed Index   | < 3.5s  | < 2.5s  |
| Total blocking time | < 300ms | < 150ms |

### Database queries per page (RSC layer)

| Page           | Cached queries (cold) | Cached queries (warm) |
| -------------- | --------------------- | --------------------- |
| `/` (home)     | 6 (site, nav, hero, posts, announcements, events, stats, dev-links) | 0 |
| `/story`       | 3 (site, nav, story, dev-links) | 0 |
| `/moments`     | 3 (site, nav, posts, dev-links) | 0 |
| `/gallery`     | 3 (site, nav, albums, dev-links) | 0 |
| `/seniors`     | 4 (site, nav, students-paginated, student-stats, dev-links) | 0 |
| `/events`      | 3 (site, nav, events, dev-links) | 0 |
| `/announcements` | 3 (site, nav, announcements, dev-links) | 0 |
| `/graduation`  | 4 (site, nav, graduation, students, dev-links) | 0 |
| `/merch`       | 3 (site, nav, merch, dev-links) | 0 |
| `/videos`      | 3 (site, nav, videos, dev-links) | 0 |
| `/contact`     | 3 (site, nav, site [cached], dev-links) | 0 |

"Warm" means the request hits the in-process LRU cache or the
persistent Data Cache — zero DB round-trips.

---

## 6. How to verify

After every perf-affecting change, run:

```bash
# 1. Type-check
bunx tsc --noEmit

# 2. Lint
bun run lint

# 3. Bundle report (writes .next/analyze/*.html)
bun run analyze

# 4. (Optional) Production build + start
bun run build && bun run start
# then Lighthouse / WebPageTest against http://localhost:3000
```

The bundle report's `client.html` is the single most useful artifact —
sort by "parsed size" descending and look for surprises. Anything from
`three`, `recharts`, `@mdxeditor`, `react-syntax-highlighter`, or
`@dnd-kit` in the client bundle means a public page is accidentally
importing an admin-only lib.
