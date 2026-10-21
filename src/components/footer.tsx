import Link from "next/link";
import {
  Instagram,
  Send,
  Youtube,
  Sparkles,
  Mail,
  Heart,
  MapPin,
  Calendar,
  Eye,
  ChevronDown,
  ArrowRight,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { Marquee } from "@/components/marquee";
import { Countdown } from "@/components/hero/countdown";
import { FooterCinematicWordmark } from "@/components/footer/cinematic-wordmark";
import { DevCredit } from "@/components/footer/dev-credit";
import { DeveloperLinkCard } from "@/components/footer/developer-link-card";
import { SmartImage } from "@/components/smart-image";
import { FooterFeatures } from "@/components/footer/footer-features";
import { getEvents, getPosts } from "@/lib/data";
import type {
  getSite,
  getFooterLinkGroups,
  getApprovedMemoryMessages,
  getDeveloperLinks,
} from "@/lib/data";

/**
 * Ultimate footer — Énouement 2K27 cinematic finale.
 *
 * Server component. Receives site / nav / developer links / footer link
 * groups / approved memory messages / visit count from PageShell, then fetches
 * the next upcoming event + latest moments feed itself (both cached).
 *
 * Layout — balanced 12-column grid on desktop (md+), single-column stack on
 * mobile:
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ [ribbon — slim announcement bar, optional]                  │
 *   │ ┌─ fog layer (3 CSS radial-gradient blobs, drift) ───────┐  │
 *   │ │                                                        │  │
 *   │ │   É N O U E M E N T   2 K 2 7   ← cinematic wordmark   │  │
 *   │ │   [ compact graduation countdown card ]                │  │
 *   │ │   [ memory wall marquee — approved messages ]          │  │
 *   │ │                                                        │  │
 *   │ │   ┌───────────┬───────────┬───────────┐                │  │
 *   │ │   │ Brand     │ Nav       │ Live      │  ← 12-col grid  │  │
 *   │ │   │ (cols 1-4)│ (cols 5-8)│ (cols 9-12)│                │  │
 *   │ │   └───────────┴───────────┴───────────┘                │  │
 *   │ │   ┌──────────────────┬──────────────────┐               │  │
 *   │ │   │ Crafted by JJ    │ Dev link cards   │  ← dev row     │  │
 *   │ │   └──────────────────┴──────────────────┘               │  │
 *   │ │   ┌──────────────────────────────────────┐               │  │
 *   │ │   │ © 2027 · Made with 💛 · Privacy TOS │  ← bottom bar  │  │
 *   │ │   └──────────────────────────────────────┘               │  │
 *   │ └────────────────────────────────────────────────────────┘  │
 *   └────────────────────────────────────────────────────────────┘
 *
 * All interactive bits are handled with native HTML primitives:
 *   • Mobile accordion → native `<details>` / `<summary>` (no JS, accessible).
 *   • Active-page indicator → tiny progressive-enhancement `<script>` that
 *     patches `aria-current="page"` on matching links (also re-applies on
 *     client-side navigation via history.pushState / replaceState / popstate).
 *
 * Performance:
 *   • Animate only transform + opacity.
 *   • Fog = 3 cheap CSS radial-gradient divs with low-frequency drift —
 *     no canvas, no blur animation (blur is a static filter).
 *   • `content-visibility: auto` on each main zone via `.cv-auto`.
 *   • The wordmark reveal is `whileInView once` (handled by
 *     FooterCinematicWordmark internally via useScroll).
 *   • `prefers-reduced-motion` + `.reduce-effects` kill the fog drift.
 */

type Site = NonNullable<Awaited<ReturnType<typeof getSite>>>;
type FooterGroup = NonNullable<
  Awaited<ReturnType<typeof getFooterLinkGroups>>
>[number];
type MemoryMsg = NonNullable<
  Awaited<ReturnType<typeof getApprovedMemoryMessages>>
>[number];
type DevLink = NonNullable<
  Awaited<ReturnType<typeof getDeveloperLinks>>
>[number];

type Props = {
  site: Site | null;
  developerLinks: DevLink[];
  footerLinkGroups: FooterGroup[];
  memoryMessages: MemoryMsg[];
  visitCount: number;
};

const SOCIALS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "telegram", icon: Send, label: "Telegram" },
  { key: "tiktok", icon: Sparkles, label: "TikTok" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
  { key: "email", icon: Mail, label: "Email" },
];

const CSS = `
/* ---- Layered fog (cheap CSS-only radial-gradient drift) ------------------ */
@keyframes uf-fog-a {
  0%, 100% { transform: translate3d(-2%, 0, 0) scale(1); }
  50%      { transform: translate3d(3%, -1%, 0) scale(1.06); }
}
@keyframes uf-fog-b {
  0%, 100% { transform: translate3d(2%, -1%, 0) scale(1.04); }
  50%      { transform: translate3d(-3%, 1%, 0) scale(0.96); }
}
@keyframes uf-fog-c {
  0%, 100% { transform: translate3d(0, 1%, 0) scale(1); }
  50%      { transform: translate3d(2%, -2%, 0) scale(1.05); }
}
.uf-fog-layer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
.uf-fog-blob  { position: absolute; border-radius: 50%; filter: blur(60px); will-change: transform; }
.uf-fog-1 {
  top: -12%; left: -8%; width: 55%; height: 60%;
  background: radial-gradient(circle at 50% 50%, rgba(255,230,0,0.16), transparent 65%);
  animation: uf-fog-a 18s ease-in-out infinite;
}
.uf-fog-2 {
  bottom: -18%; right: -8%; width: 50%; height: 55%;
  background: radial-gradient(circle at 50% 50%, rgba(0,200,83,0.18), transparent 65%);
  animation: uf-fog-b 22s ease-in-out infinite;
}
.uf-fog-3 {
  top: 22%; left: 38%; width: 32%; height: 32%;
  background: radial-gradient(circle at 50% 50%, rgba(185,246,202,0.12), transparent 65%);
  animation: uf-fog-c 26s ease-in-out infinite;
}

/* ---- Announcement ribbon ------------------------------------------------- */
.uf-ribbon {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.55rem 1rem;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
  color: #050a07;
  text-decoration: none;
  transition: filter 0.2s ease;
}
.uf-ribbon:hover { filter: brightness(1.08); }

/* ---- Footer link hover micro-interactions -------------------------------- */
.uf-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--foreground) 70%, transparent);
  text-decoration: none;
  padding: 0.3rem 0;
  transition: color 0.25s ease, transform 0.25s ease;
  min-height: 28px;
}
.uf-link::before {
  content: "";
  display: inline-block;
  height: 1px;
  width: 0;
  background: var(--primary);
  transition: width 0.3s ease, margin-right 0.3s ease;
}
.uf-link:hover { color: var(--primary); transform: translateX(2px); }
.uf-link:hover::before { width: 0.85rem; margin-right: 0.2rem; }
.uf-link:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 2px; }
.uf-link[aria-current="page"] { color: var(--primary); }
.uf-link[aria-current="page"]::before { width: 0.85rem; margin-right: 0.2rem; }

/* ---- "New" badge --------------------------------------------------------- */
.uf-new-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.05rem 0.35rem;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  color: #050a07;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 1.4;
  text-shadow: none;
}

/* ---- Mobile accordion (native <details>) --------------------------------- */
.uf-details { border-bottom: 1px solid var(--border); }
.uf-details > summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.85rem 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--foreground);
  min-height: 44px;
}
.uf-details > summary::-webkit-details-marker { display: none; }
.uf-details > summary .uf-chevron { transition: transform 0.3s ease; flex-shrink: 0; }
.uf-details[open] > summary .uf-chevron { transform: rotate(180deg); }
.uf-details-list {
  list-style: none;
  padding: 0 0 0.75rem 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

/* ---- Moments strip — horizontal swipe with scroll-snap ------------------- */
.uf-moments {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 2px 2px 6px 2px;
  scrollbar-width: none;
}
.uf-moments::-webkit-scrollbar { display: none; }
.uf-moment {
  position: relative;
  flex: 0 0 84px;
  width: 84px;
  height: 84px;
  border-radius: 0.6rem;
  overflow: hidden;
  scroll-snap-align: start;
  border: 1px solid var(--border);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: block;
}
.uf-moment:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -8px rgba(255, 230, 0, 0.45);
}
.uf-moment:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ---- Event card ---------------------------------------------------------- */
.uf-event-card {
  display: block;
  padding: 1rem;
  border-radius: 0.9rem;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.uf-event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px rgba(0, 200, 83, 0.3);
}
.uf-event-card:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ---- Visit counter badge ------------------------------------------------- */
.uf-visit-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 99px;
  font-size: 0.7rem;
  font-family: var(--font-mono, ui-monospace), monospace;
  color: var(--foreground);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--card) 50%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ---- Socials row --------------------------------------------------------- */
.uf-social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  color: color-mix(in srgb, var(--foreground) 65%, transparent);
  text-decoration: none;
  transition: color 0.3s ease, transform 0.3s ease;
}
.uf-social:hover { color: var(--primary); transform: translateY(-2px); }
.uf-social:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ---- Reduced motion / reduce-effects ------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .uf-fog-blob { animation: none !important; }
}
.reduce-effects .uf-fog-blob { animation: none !important; }
`;

const ACTIVE_SCRIPT = `(function(){
  function ufUpdate(){
    try {
      var p = (location.pathname || '/').replace(/\\/+$/,'') || '/';
      document.querySelectorAll('[data-footer-link]').forEach(function(a){
        var h = (a.getAttribute('href') || '/').replace(/\\/+$/,'') || '/';
        if (h === p) a.setAttribute('aria-current','page');
        else a.removeAttribute('aria-current');
      });
    } catch(e) {}
  }
  ufUpdate();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(ufUpdate);
  window.addEventListener('popstate', ufUpdate);
  // Re-apply after client-side navigations (Next.js App Router uses pushState)
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function(){ var r = origPush.apply(this, arguments); ufUpdate(); return r; };
  history.replaceState = function(){ var r = origReplace.apply(this, arguments); ufUpdate(); return r; };
})();`;

function fmtDate(d: Date | string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function fmtMonth(d: Date | string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export async function Footer({
  site,
  developerLinks,
  footerLinkGroups,
  memoryMessages,
  visitCount,
}: Props) {
  // ---- Resolve all site settings (with sensible defaults) -----------------
  const siteName = site?.siteName ?? "Énouement 2K27";
  const tagline = site?.tagline ?? "The Final Chapter — Class of 2027";
  const footerBlurb =
    site?.footerBlurb ??
    "A cinematic memory of the senior batch — every moment, every face, every story, preserved forever.";
  const footerText = site?.footerText ?? "";
  const socialLinks = (site?.socialLinks as Record<string, string>) ?? {};
  const devName = site?.devName || "Joseph James";
  const devRole = site?.devRole || "Full-Stack Developer";
  const devLink = site?.devLink || null;
  const countdownDate = site?.countdownDate;
  const countdownLabel = site?.countdownLabel || "Graduation Day";
  const memoryWallEnabled = site?.memoryWallEnabled ?? true;
  const liveCounterEnabled = site?.liveCounterEnabled ?? true;

  // ---- Footer-internal fetches (both cached, deduped across the page) ------
  const [events, postsData] = await Promise.all([getEvents(), getPosts(6)]);
  const now = new Date();
  const nextEvent =
    events.find((e) => new Date(e.startDate).getTime() > now.getTime()) ?? null;
  const latestPosts = postsData.items
    .filter((p) => Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0)
    .slice(0, 6);

  // ---- Announcement ribbon logic ------------------------------------------
  const ribbonEnabled = !!site?.ribbonEnabled && !!site?.ribbonText;
  const ribbonExpired = site?.ribbonExpiry
    ? new Date(site.ribbonExpiry).getTime() < now.getTime()
    : false;
  const showRibbon = ribbonEnabled && !ribbonExpired;
  const ribbonColor = site?.ribbonColor || "#ffe600";
  const ribbonText = site?.ribbonText || "";
  const ribbonLink = site?.ribbonLink || "";

  // ---- Memory wall marquee text -------------------------------------------
  const memoryText = memoryMessages
    .slice(0, 20)
    .map((m) => `“${m.message}” — ${m.name}`)
    .join("  ✦  ");

  const year = new Date().getFullYear();
  const monthLabel = fmtMonth(now);

  return (
    <footer
      className="relative mt-auto overflow-hidden border-t border-border/60 bg-surface/40"
      aria-label="Site footer"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ===== Announcement ribbon (slim bar above the footer content) ===== */}
      {showRibbon ? (
        ribbonLink ? (
          <a
            href={ribbonLink}
            className="uf-ribbon relative z-20"
            style={{ background: ribbonColor }}
          >
            {ribbonText}
          </a>
        ) : (
          <div
            className="uf-ribbon relative z-20"
            style={{ background: ribbonColor }}
            role="status"
          >
            {ribbonText}
          </div>
        )
      ) : null}

      {/* ===== Layered fog (cheap CSS radial-gradient drift) ============== */}
      <div aria-hidden className="uf-fog-layer">
        <div className="uf-fog-blob uf-fog-1" />
        <div className="uf-fog-blob uf-fog-2" />
        <div className="uf-fog-blob uf-fog-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        {/* ===================== TOP FINALE ===================== */}
        <div className="relative mb-12 text-center">
          <FooterCinematicWordmark className="mb-8" />
          {countdownDate ? (
            <div className="mx-auto max-w-xl">
              <Countdown date={new Date(countdownDate)} label={countdownLabel} />
            </div>
          ) : null}
        </div>

        {/* ============== MEMORY WALL MARQUEE (if enabled) ============== */}
        {memoryWallEnabled && memoryMessages.length > 0 ? (
          <div className="mb-14">
            <div className="mb-2 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
              <Quote className="h-3 w-3 text-primary" aria-hidden />
              Memories from the batch
            </div>
            <Marquee
              text={memoryText}
              duration={42}
              className="border-y-0 py-1.5"
            />
          </div>
        ) : null}

        {/* ===================== MAIN ROW (12-col grid) ===================== */}
        <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-6">
          {/* ---- BRAND ZONE (cols 1-4) ---- */}
          <div className="cv-auto md:col-span-4">
            <div className="flex items-center gap-2.5">
              {site?.logoUrl ? (
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg">
                  <SmartImage
                    src={site.logoUrl}
                    alt={`${siteName} logo`}
                    fill
                    sizes="40px"
                    cloudinaryWidth={80}
                    className="object-cover"
                    seed="footer-site-logo"
                  />
                </span>
              ) : (
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <span className="font-display text-xl font-extrabold tracking-tight">
                {siteName}
              </span>
            </div>

            <p className="mt-4 font-display text-sm font-semibold text-foreground">
              {tagline}
            </p>

            {footerBlurb ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {footerBlurb}
              </p>
            ) : null}

            {/* Socials */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {SOCIALS.map(({ key, icon: Icon, label }) => {
                const href = socialLinks?.[key];
                if (!href) return null;
                const isEmail = key === "email";
                return (
                  <a
                    key={key}
                    href={href}
                    {...(!isEmail
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    aria-label={label}
                    title={label}
                    className="uf-social glass"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* Visit counter badge */}
            {liveCounterEnabled ? (
              <div className="mt-5">
                <span
                  className="uf-visit-badge"
                  title={`${monthLabel} visits`}
                >
                  <Eye className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="tabular-nums font-semibold">
                    {visitCount.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    visits · {monthLabel}
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          {/* ---- NAVIGATION ZONE (cols 5-8) ---- */}
          <nav
            aria-label="Footer"
            className="cv-auto md:col-span-4"
          >
            {/* Desktop: three tidy columns side-by-side */}
            <div className="hidden grid-cols-3 gap-4 md:grid">
              {footerLinkGroups.map((group) => (
                <div key={group.id}>
                  <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {group.title}
                  </h4>
                  <ul className="mt-3 space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.id}>
                        <Link href={link.href} data-footer-link className="uf-link">
                          <span>{link.label}</span>
                          {link.isNew ? (
                            <span className="uf-new-badge" aria-label="new">
                              New
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Mobile: native <details> accordion (no JS, accessible) */}
            <div className="md:hidden">
              {footerLinkGroups.map((group) => (
                <details key={group.id} className="uf-details">
                  <summary>
                    <span>{group.title}</span>
                    <ChevronDown
                      className="uf-chevron h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                  </summary>
                  <ul className="uf-details-list">
                    {group.links.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          data-footer-link
                          className="uf-link"
                        >
                          <span>{link.label}</span>
                          {link.isNew ? (
                            <span className="uf-new-badge" aria-label="new">
                              New
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>

            {footerLinkGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">
                Navigation coming soon.
              </p>
            ) : null}
          </nav>

          {/* ---- LIVE ZONE (cols 9-12) ---- */}
          <div className="cv-auto space-y-6 md:col-span-4">
            {/* "Next Up" event card */}
            {nextEvent ? (
              <Link
                href={`/events/${nextEvent.slug}`}
                className="uf-event-card glass block"
              >
                <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary">
                  <Calendar className="h-3 w-3" aria-hidden />
                  Next Up
                </div>
                <h4 className="mt-1.5 font-display text-base font-bold leading-tight text-foreground">
                  {nextEvent.title}
                </h4>
                <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {fmtDate(nextEvent.startDate)}
                  </span>
                  {nextEvent.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {nextEvent.location}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3">
                  <Countdown date={new Date(nextEvent.startDate)} label="Countdown" />
                </div>
              </Link>
            ) : null}

            {/* "Latest Moments" strip */}
            {latestPosts.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Latest Moments
                  </h4>
                  <Link
                    href="/moments"
                    className="inline-flex items-center gap-1 text-[0.7rem] text-primary transition-colors hover:text-secondary"
                    data-footer-link
                  >
                    All
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
                <div className="uf-moments" data-lenis-prevent>
                  {latestPosts.map((post) => (
                    <Link
                      key={post.id}
                      href="/moments"
                      className="uf-moment"
                      aria-label={post.caption || "Open moment"}
                      title={post.caption || "Open moment"}
                    >
                      <SmartImage
                        src={post.mediaUrls[0]}
                        alt={post.caption || "Moment"}
                        fill
                        sizes="84px"
                        cloudinaryWidth={168}
                        className="object-cover"
                        seed={post.id}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ===================== DEVELOPER ROW ===================== */}
        {developerLinks.length === 0 ? (
          /* No dev links — credit block centers and owns the whole row */
          <div className="mb-10 flex justify-center">
            <DevCredit devName={devName} devRole={devRole} devLink={devLink} />
          </div>
        ) : (
          <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <DevCredit devName={devName} devRole={devRole} devLink={devLink} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {developerLinks.map((link) => (
                <DeveloperLinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        )}

        {/* ===================== FOOTER FEATURES (lazy client) ===================== */}
        <FooterFeatures site={site} visitCount={visitCount} />

        {/* ===================== BOTTOM BAR ===================== */}
        <div className="safe-b border-t border-border/40 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
              <span>
                © {year} {siteName}
              </span>
              <span aria-hidden className="hidden text-border sm:inline">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                Made with{" "}
                <Heart
                  className="inline h-3 w-3 fill-primary text-primary"
                  aria-hidden
                />{" "}
                by {devName}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
              <Link
                href="/privacy"
                className="transition-colors hover:text-primary"
                data-footer-link
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-primary"
                data-footer-link
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-primary"
                data-footer-link
              >
                Contact
              </Link>
            </div>
          </div>
          {footerText ? (
            <p className="mt-3 text-center text-[0.65rem] text-muted-foreground/70 sm:text-left">
              {footerText}
            </p>
          ) : null}
        </div>
      </div>

      {/* Active-page indicator — tiny progressive enhancement, no React state.
          Patches aria-current="page" on links matching location.pathname,
          re-applies on popstate + history.pushState/replaceState (Next.js App
          Router client-side nav). */}
      <script dangerouslySetInnerHTML={{ __html: ACTIVE_SCRIPT }} />
    </footer>
  );
}

export default Footer;
