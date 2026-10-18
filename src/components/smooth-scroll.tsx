"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Insane smooth scroll provider (Lenis).
 *
 * - Disabled entirely on /admin (native scroll for precision + tables).
 * - Disabled if prefers-reduced-motion OR .reduce-effects is on <html>.
 * - Tuned for buttery smooth on both desktop (wheel/trackpad) and mobile (touch):
 *     duration 1.2s, easing custom exponential, wheelMultiplier 1.0,
 *     touchMultiplier 1.5, smoothWheel + smoothTouch off (let native touch
 *     scroll handle momentum on mobile — Lenis smoothTouch can feel laggy).
 * - Syncs with framer-motion's useScroll (Lenis updates scrollYProgress).
 * - Syncs with GSAP ScrollTrigger if loaded (single rAF clock via gsap.ticker
 *   when available; otherwise a standalone rAF loop).
 * - Anchors the requestAnimationFrame loop.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // No smooth scroll in admin
    if (pathname?.startsWith("/admin")) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const hasReduceClass = document.documentElement.classList.contains("reduce-effects");
    if (hasReduceClass) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.005 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      // Don't hijack inner scroll containers
      prevent: (node: Element) => {
        // Any element marked data-lenis-prevent (or inside one) is skipped
        return (
          node instanceof HTMLElement &&
          (node.dataset.lenisPrevent !== undefined ||
            !!node.closest("[data-lenis-prevent]"))
        );
      },
    });

    /* ----- Sync with GSAP ScrollTrigger if it's loaded on this page ----- */
    // CinematicWordmark (and any other GSAP consumer) registers ScrollTrigger
    // at module-load time, so by the time this effect runs (parent effect,
    // after child effects), window.ScrollTrigger exists when GSAP is in use.
    const w = window as unknown as {
      ScrollTrigger?: { update: () => void };
      gsap?: {
        ticker: {
          add: (cb: (time: number) => void) => void;
          remove: (cb: (time: number) => void) => void;
          lagSmoothing: (n: number) => void;
        };
      };
    };

    // Tell ScrollTrigger to recompute whenever Lenis scrolls — this is what
    // keeps GSAP pinned sections + scrub timelines in lockstep with Lenis
    // (instead of the native scroll position which lags by one frame).
    lenis.on("scroll", () => {
      if (w.ScrollTrigger) w.ScrollTrigger.update();
    });

    /* ----- Single animation clock ----- */
    // Prefer gsap.ticker so there's exactly one rAF loop driving both GSAP
    // tweens and Lenis (no double-update jitter). Fall back to a standalone
    // rAF loop on pages where GSAP isn't imported (e.g. /announcements).
    let rafId = 0;
    let gsapUpdate: ((time: number) => void) | undefined;
    const useGsap = !!w.gsap;

    if (useGsap && w.gsap) {
      // gsap.ticker passes time in SECONDS — Lenis.raf expects ms.
      gsapUpdate = (time: number) => lenis.raf(time * 1000);
      w.gsap.ticker.add(gsapUpdate);
      // Lag smoothing defers updates after long frames; Lenis already smooths,
      // so disabling it keeps the clock tight with native scroll.
      w.gsap.ticker.lagSmoothing(0);
    } else {
      const loop = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    // Expose lenis globally so other components (e.g. back-to-top) can call
    // lenis.scrollTo(0) for a buttery animated scroll to top.
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    return () => {
      if (useGsap && w.gsap && gsapUpdate) {
        w.gsap.ticker.remove(gsapUpdate);
      } else {
        cancelAnimationFrame(rafId);
      }
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, [pathname]);

  return <>{children}</>;
}
