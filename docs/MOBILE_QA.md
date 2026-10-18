# Mobile QA — ENOUEMENT 2K27

Audited and patched as part of task **U3-SCROLL-RESP**.

## Viewports mentally verified (by reading the source)

| Width  | Typical device                         |
| ------ | -------------------------------------- |
| 360px  | Small Android (Galaxy S10e, older A-series) |
| 390px  | iPhone 12/13/14/15 (standard)          |
| 412px  | Pixel / large Android                  |
| 768px  | iPad portrait                          |
| 1024px | iPad landscape / small laptop          |

Both **dark** (default cinematic deep green-black) and **light** (warm cream) themes were checked.

> Caveat: this audit was performed **by reading the component source** — no
> physical device or emulator was used. Layout math was checked (clamp(),
> max-w-*, flex-1 + min-w-0 + min-h-0 patterns, dvh units, safe-area insets)
> and the scroll/touch behaviour was patched proactively. Real-device
> testing on Chrome Android + Safari iOS is still recommended before launch.

---

## What was fixed

### Part A — Scrolling & touchpad

1. **Lenis disabled inside `/admin`**
   `src/components/smooth-scroll.tsx` now reads `usePathname()` and returns
   early when the route starts with `/admin`. Admin uses native scroll
   everywhere (data tables, long forms) — no hijacking.

2. **`data-lenis-prevent` on every overlay**
   Added to the root content element of:
   - `DialogContent` (`src/components/ui/dialog.tsx`)
   - `SheetContent` (`src/components/ui/sheet.tsx`)
   - `AlertDialogContent` (`src/components/ui/alert-dialog.tsx`)
   - `DrawerContent` (`src/components/ui/drawer.tsx`)
   - Admin sidebar (`src/components/admin/admin-shell.tsx`)
   - Moments lightbox (`src/components/moments/lightbox.tsx`)
   - Gallery masonry lightbox (`src/components/gallery/masonry-lightbox.tsx`)

   Lenis ignores wheel/touch events that originate inside these elements, so
   inner scroll containers work with native momentum.

3. **`overscroll-behavior: contain`** (scroll-chaining prevention)
   New utility class `.scroll-contain { overscroll-behavior: contain;
   -webkit-overflow-scrolling: touch; }` added to `src/app/globals.css`.
   Applied to every overlay content listed above + the admin sidebar nav +
   the masonry grid scroll area + the photo-viewer sub-overlay. Now when a
   modal hits its top/bottom bound the page behind it no longer scrolls.

4. **Body scroll lock verification**
   - `src/components/navbar.tsx` mobile menu — already locks body scroll
     via `document.body.style.overflow = "hidden"` when open. ✅ verified.
   - `src/components/moments/lightbox.tsx` — already locks body scroll on
     open. ✅ verified.
   - `src/components/gallery/masonry-lightbox.tsx` — already locks body
     scroll on open. ✅ verified.
   - shadcn `Dialog` / `Sheet` / `AlertDialog` / `Drawer` — Radix
     `@radix-ui/react-dismissable-layer` handles body scroll lock
     internally. ✅ verified; no duplicate logic added.

5. **Overflow rules on modal/drawer content**
   - `DialogContent` now has `max-h-[90dvh] overflow-y-auto` baked into the
     primitive so long forms never overflow the viewport.
   - `AlertDialogContent` — `max-h-[90dvh] overflow-y-auto`.
   - `SheetContent` — `max-h-[100dvh] overflow-y-auto` (full-height sheet
     still scrolls internally if its content is taller than the screen).
   - `DrawerContent` — `max-h-[85dvh] overflow-y-auto` (was `80vh`).
   - Resource-form modal bumped from `max-h-[90vh]` → `max-h-[90dvh]`.
   - Album-media dialog bumped from `max-h-[90vh]` → `max-h-[90dvh]`.
   - Admin sidebar nav: `min-h-0 flex-1 overflow-y-auto` (was missing
     `min-h-0`, which is required for `overflow-y-auto` to work inside a
     `flex flex-col` parent).

6. **Native scroll restored in /admin**
   Because Lenis is fully disabled in `/admin`, trackpad/wheel + keyboard
   (Space / PageUp / PageDown / arrows) scroll every region natively.
   `data-lenis-prevent` covers the public-site overlays.

### Part B — Phone-first responsive fixes

1. **`100vh` → `100dvh`**
   Audited the whole `src/` tree (see Grep results). The codebase already
   uses `100dvh` / `100svh` everywhere except the modal primitives (now
   fixed). `h-screen` and `100vh` are no longer present.

2. **Tap targets bumped to ≥44px**
   - Public navbar hamburger (open) — `h-9 w-9` → `h-11 w-11` (44px).
   - Public navbar hamburger (close in mobile menu) — `h-9 w-9` → `h-11 w-11`.
   - Admin top-bar hamburger, theme toggle, sign-out — added `size-11`
     (44px) overrides to the existing `size="icon"` (was 36px).
   - Admin sidebar nav links — `min-h-[44px]` added.
   - Back-to-top button — already `h-12 w-12` (48px). ✅.

3. **Safe-area insets**
   - Public navbar already had `safe-t`.
   - Mobile menu bottom caption now has `safe-b`.
   - Back-to-top button now has `safe-b`.

4. **Admin tables on mobile**
   - `src/components/admin/data-table.tsx` already wraps `<Table>` in
     `<div className="overflow-x-auto">` — tables scroll horizontally on
     narrow screens. ✅ verified.

5. **Admin mobile nav**
   - Verified the admin shell uses a `Sheet` (left side) for mobile
     navigation, triggered from a top-bar hamburger (≥44px). Nav links
     close the sheet on click. ✅.

6. **Lightbox swipe**
   - `src/components/moments/lightbox.tsx` uses `framer-motion` `drag="x"`
     with `dragConstraints={{ left: 0, right: 0 }}` + `dragElastic={0.18}`
     + `onDragEnd` threshold 80px. ✅ verified.
   - `src/components/gallery/masonry-lightbox.tsx` mirrors the same
     pattern for its single-image viewer. ✅.
   - `overscroll-behavior: contain` added to both so pull-to-refresh
     doesn't fire while swiping.

7. **Text sizes**
   - Audited all admin labels and interactive text — no `text-xs` or
     smaller on interactive elements.
   - The remaining `text-[9px]` / `text-[10px]` / `text-[11px]` instances
     are on **non-interactive** decorative labels (SUPER badge, role badge,
     admin footer copyright, moments feed tags, "0X" numbering on hero
     slide indicator). These are acceptable per the brief ("no `text-xs`
     or smaller on **important interactive labels**").

8. **Overflow / fixed widths**
   - No `w-screen` without `overflow-hidden` found in the audited files.
   - Hero uses `clamp()` font sizing for the wordmark and countdown
     numbers (done in a prior task). No new fixed-width offenders
     surfaced in this audit.

9. **`prefers-reduced-motion`**
   - Already handled globally via `globals.css` `@media
     (prefers-reduced-motion: reduce)` block that nulls animation and
     transition durations.
   - Lightboxes also check `prefersReducedMotion` at module load and
     skip the swipe snap-back animation if reduced motion is requested.

---

## Files modified (minimal, surgical changes only)

- `src/app/globals.css` — added `.scroll-contain` utility.
- `src/components/smooth-scroll.tsx` — disabled Lenis on `/admin`.
- `src/components/ui/dialog.tsx` — `data-lenis-prevent` + `max-h-[90dvh] overflow-y-auto` + `scroll-contain`.
- `src/components/ui/sheet.tsx` — `data-lenis-prevent` + `max-h-[100dvh] overflow-y-auto` + `scroll-contain`.
- `src/components/ui/alert-dialog.tsx` — `data-lenis-prevent` + `max-h-[90dvh] overflow-y-auto` + `scroll-contain`.
- `src/components/ui/drawer.tsx` — `data-lenis-prevent` + `max-h-[85dvh] overflow-y-auto` + `scroll-contain`.
- `src/components/admin/admin-shell.tsx` — `data-lenis-prevent` on sidebar, `min-h-0` on nav, `scroll-contain`, `min-h-[44px]` links, `size-11` icon buttons.
- `src/components/admin/resource-form.tsx` — `max-h-[90vh]` → `max-h-[90dvh]`.
- `src/components/admin/albums-manager.tsx` — `max-h-[90vh]` → `max-h-[90dvh]`.
- `src/components/admin/data-table.tsx` — verified only (already had `overflow-x-auto` wrapper).
- `src/components/moments/lightbox.tsx` — `data-lenis-prevent` + `scroll-contain` on root overlay.
- `src/components/gallery/masonry-lightbox.tsx` — `data-lenis-prevent` + `scroll-contain` on album overlay, single-image sub-overlay, and masonry scroll area; `min-h-0` added to the masonry scroll container.
- `src/components/navbar.tsx` — hamburger open/close tap targets `h-9 w-9` → `h-11 w-11`; `safe-b` on mobile-menu footer.
- `src/components/back-to-top.tsx` — `safe-b` added.

## Files NOT touched (per constraints)

- `src/lib/**`, `prisma/**`, `src/db/**`, `src/app/layout.tsx`, `tailwind.config.ts`, `package.json`.

---

## Verified-by-reading ✅ vs. Needs-real-device-testing ⚠

### ✅ Verified by reading source

- Lenis does not initialise on `/admin/*` routes.
- Every shadcn overlay primitive carries `data-lenis-prevent` +
  `overscroll-behavior: contain` + `overflow-y-auto` + a `max-h-[..dvh]`.
- Admin sidebar has `min-h-0` + `overflow-y-auto` so it scrolls within
  its flex parent without leaking to the page.
- Admin tables horizontally scroll on narrow screens.
- All tap-targets audited meet ≥44px minimum.
- All `100vh` / `h-screen` patterns converted to `dvh`.
- Lightbox swipe uses `drag="x"` + `dragConstraints`.
- Body scroll is locked when navbar mobile menu / moments lightbox /
  gallery lightbox open (existing behaviour, confirmed).

### ⚠ Needs real-device testing before launch

- iOS Safari 100dvh behaviour on iPhone 12/13/14/15 (URL bar hide/show).
- Android Chrome pull-to-refresh being fully suppressed by
  `overscroll-behavior: contain` on the lightbox overlay (some OEM
  browsers still fire it; consider `touch-action: none` on the swipe
  image element if it persists).
- iPadOS 17 Safari keyboard focus + scroll inside the admin Sheet nav.
- Pixel 7 keyboard PageUp/PageDown inside admin tables (native scroll
  should work since Lenis is disabled).
- iOS safe-area-inset values on real notched devices (the `safe-b` /
  `safe-t` utilities rely on `env(safe-area-inset-*)` being non-zero).
- Reduced-motion users on iOS Safari (the global reduced-motion media
  query plus the in-component `prefersReducedMotion` checks should
  already cover this, but worth confirming swipe snap-back is instant).
