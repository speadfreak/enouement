"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { MagneticButton } from "@/components/magnetic-button";
import { SmartImage } from "@/components/smart-image";
import { Countdown } from "./countdown";
import { CinematicWordmark } from "./cinematic-wordmark";
import { usePerformanceTier } from "@/hooks/use-performance-tier";
import { useFps } from "@/hooks/use-fps";

// 3D scene is dynamically imported with ssr:false to avoid SSR / three.js
// issues. It is *also* only mounted after the LCP (wordmark) has painted AND
// the preloader has unmounted, so the browser never has to choose between
// the intro's 2D canvas and the hero's WebGL context on first paint.
const HeroScene = dynamic(
  () => import("./hero-scene").then((m) => m.HeroScene),
  { ssr: false, loading: () => null },
);

export type HeroSlide = {
  id: string;
  url: string;
  title: string | null;
  duration: number;
};

type Props = {
  slides: HeroSlide[];
  countdownDate: string | Date;
  countdownLabel: string;
  tagline?: string;
};

/* Floating dust particles — CSS only, decorative */
const DUST = [
  { left: "8%", top: "22%", size: 3, delay: 0, dur: 7 },
  { left: "22%", top: "70%", size: 2, delay: 1.2, dur: 9 },
  { left: "35%", top: "30%", size: 4, delay: 2.1, dur: 8 },
  { left: "48%", top: "78%", size: 2, delay: 0.6, dur: 10 },
  { left: "62%", top: "18%", size: 3, delay: 3.0, dur: 7.5 },
  { left: "74%", top: "62%", size: 2, delay: 1.7, dur: 9.5 },
  { left: "85%", top: "40%", size: 3, delay: 2.6, dur: 8.5 },
  { left: "92%", top: "76%", size: 2, delay: 0.3, dur: 11 },
];

export function Hero({
  slides,
  countdownDate,
  countdownLabel,
  tagline = "The Final Chapter — every moment, every face, every story of the senior batch, preserved forever.",
}: Props) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  /* --- performance tier (static capability) + live FPS auto-step-down --- */
  const baseTier = usePerformanceTier();
  const { tier } = useFps(baseTier);

  /* --- deferred 3D mount --------------------------------------------------
   * The 3D canvas only mounts once:
   *   1. the wordmark + countdown + slideshow have painted (requestAnimationFrame
   *      × 2 — the "double rAF" idiom that guarantees a frame has been
   *      committed to the screen, not just queued), AND
   *   2. the preloader overlay (`.pl-root`) has been torn down — so we never
   *      run the intro's 2D canvas + the hero's WebGL context at the same
   *      time. If the preloader is already gone (e.g. reduced-motion path,
   *      which mounts for ~0.8s), step through immediately.
   *   3. the browser is idle (requestIdleCallback with a 1s timeout fallback
   *      to setTimeout(200) on Safari).
   * Tier "low" / "off" never mounts the 3D scene at all — the poster
   * (slideshow + wordmark + gradient) is the hero.
   */
  const [canMount3D, setCanMount3D] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    let cancelled = false;
    let r1 = 0;
    let r2 = 0;
    let safetyTimer: number | undefined;

    const mount = () => {
      if (cancelled) return;
      setCanMount3D(true);
    };

    const scheduleIdle = () => {
      if (cancelled) return;
      const ric = (
        window as unknown as {
          requestIdleCallback?: (
            cb: () => void,
            opts?: { timeout?: number },
          ) => number;
        }
      ).requestIdleCallback;
      if (typeof ric === "function") {
        ric(mount, { timeout: 1000 });
      } else {
        window.setTimeout(mount, 200);
      }
    };

    const waitForPreloader = () => {
      if (cancelled) return;
      if (!document.querySelector(".pl-root")) {
        scheduleIdle();
        return;
      }
      // Preloader still mounted — watch for its removal via MutationObserver.
      const obs = new MutationObserver(() => {
        if (cancelled) {
          obs.disconnect();
          return;
        }
        if (!document.querySelector(".pl-root")) {
          obs.disconnect();
          scheduleIdle();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      // Safety net: if the preloader hangs for any reason, mount anyway.
      safetyTimer = window.setTimeout(() => {
        obs.disconnect();
        scheduleIdle();
      }, 6000);
    };

    // Double-rAF — guarantees at least one frame has painted before we touch
    // the 3D path, so LCP is never delayed by WebGL init.
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(waitForPreloader);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      if (safetyTimer) window.clearTimeout(safetyTimer);
    };
  }, []);

  /* The 3D scene is only worth mounting on high/medium tiers and only after
   * the deferred-mount gate above has flipped. */
  const sceneActive =
    canMount3D && (tier === "high" || tier === "medium");

  // Crossfade slideshow.
  useEffect(() => {
    if (slides.length <= 1 || reduced) return;
    const dur = slides[index]?.duration ?? 6000;
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      Math.min(Math.max(dur, 4000), 9000)
    );
    return () => clearTimeout(id);
  }, [index, slides, reduced]);

  const safeSlides = slides.length > 0 ? slides : [
    { id: "fallback", url: "/hero/hero-1.jpg", title: "Enouement", duration: 6000 },
  ];
  const current = safeSlides[index % safeSlides.length];
  const slideTitle = current.title ?? "";

  return (
    <section
      ref={sectionRef}
      aria-label="Hero — Enouement 2K27"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* ------------------------------------------------------------ */}
      {/*  Background slideshow with ken-burns zoom                     */}
      {/* ------------------------------------------------------------ */}
      <div className="absolute inset-0 -z-30">
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id + index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: reduced ? 1 : 1.08 }}
              transition={{
                duration: (current.duration || 6000) / 1000,
                ease: "linear",
              }}
              className="absolute inset-0"
            >
              <SmartImage
                src={current.url}
                alt={current.title ?? "Enouement hero"}
                fill
                sizes="100vw"
                cloudinaryWidth={1920}
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                wrapperClassName="absolute inset-0"
                className="object-cover"
                seed={current.id}
                fallbackLabel={current.title ?? "ENOUEMENT 2K27"}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* legibility overlays — sit BEHIND the 3D scene so 3D stays visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_0%,rgba(5,10,7,0.35)_72%)]" />
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  3D scene overlay — hidden on phones / low tier. Mounted      */}
      {/*  only after LCP paints and the preloader tears down.           */}
      {/* ------------------------------------------------------------ */}
      <div className="absolute inset-0 -z-20 hidden md:block">
        {sceneActive && <HeroScene tier={tier} />}
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Floating dust particles (decorative, CSS-only)                */}
      {/* ------------------------------------------------------------ */}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          {DUST.map((d, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-accent/40 animate-floaty"
              style={{
                left: d.left,
                top: d.top,
                width: d.size,
                height: d.size,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.dur}s`,
                boxShadow: "0 0 8px rgba(185, 246, 202, 0.5)",
              }}
            />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Vignette — darkens edges for cinematic frame                  */}
      {/* ------------------------------------------------------------ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,10,7,0.65)_100%)]"
      />

      {/* ------------------------------------------------------------ */}
      {/*  Content                                                       */}
      {/* ------------------------------------------------------------ */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        {/* eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] text-primary sm:text-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Class of 2027 · Ethiopia
        </motion.span>

        {/* CINEMATIC WORDMARK — full-bleed within the 7xl container */}
        <div className="mt-6">
          <CinematicWordmark heroRef={sectionRef} />
        </div>

        {/* tagline + CTA — narrower column for readability */}
        <div className="mt-6 max-w-4xl">
          {/* tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.7 }}
            className="max-w-xl text-sm text-foreground/80 sm:text-lg"
          >
            {tagline}
          </motion.p>

          {/* CTA buttons — stack on phones, row on sm+ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7 }}
            className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <MagneticButton
              href="/story"
              className="bg-primary text-primary-foreground hover:glow-primary min-h-[44px] rounded-full px-7 py-3.5 text-sm font-semibold sm:px-8"
            >
              Enter the story
              <ArrowRight className="ml-2 h-4 w-4" />
            </MagneticButton>
            <MagneticButton
              href="/moments"
              strength={0.3}
              className="glass text-foreground hover:glow-primary min-h-[44px] rounded-full px-7 py-3.5 text-sm font-semibold sm:px-8"
            >
              <Play className="mr-2 h-3.5 w-3.5 fill-current" />
              Live moments
            </MagneticButton>
          </motion.div>
        </div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.95, duration: 0.8 }}
          className="mt-12 max-w-xl sm:mt-16 md:max-w-2xl"
        >
          <Countdown date={countdownDate} label={countdownLabel} />
        </motion.div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Slide label — hidden on phones to prevent overlap with the   */}
      {/*  countdown grid; shows above sm breakpoint where space allows. */}
      {/* ------------------------------------------------------------ */}
      {slideTitle && (
        <AnimatePresence mode="wait">
          <motion.div
            key={slideTitle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute bottom-6 right-4 z-10 hidden max-w-[55vw] text-right sm:bottom-8 sm:right-6 sm:block lg:right-8"
          >
            <span className="block text-[0.55rem] uppercase tracking-[0.35em] text-muted-foreground sm:text-[0.65rem]">
              Chapter {String((index % safeSlides.length) + 1).padStart(2, "0")}
            </span>
            <span className="mt-1 block font-display text-xs font-semibold uppercase tracking-[0.25em] text-primary sm:text-sm">
              {slideTitle}
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Scroll indicator                                              */}
      {/* ------------------------------------------------------------ */}
      <motion.a
        href="#stats"
        aria-label="Scroll to explore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground sm:flex"
      >
        <span>Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block h-10 w-[1px] bg-gradient-to-b from-primary via-primary/60 to-transparent"
        />
      </motion.a>

      {/* slide indicator dots */}
      <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        {safeSlides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Slide ${i + 1}: ${s.title ?? ""}`}
            onClick={() => setIndex(i)}
            className="group relative h-2 w-2"
          >
            <span
              className={`absolute inset-0 rounded-full transition-all duration-500 ${
                i === index
                  ? "scale-100 bg-primary shadow-[0_0_10px_var(--glow)]"
                  : "scale-75 bg-foreground/30 group-hover:bg-foreground/60"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

export default Hero;
