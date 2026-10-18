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

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Expose lenis globally so other components (e.g. back-to-top) can call
    // lenis.scrollTo(0) for a buttery animated scroll to top.
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, [pathname]);

  return <>{children}</>;
}
