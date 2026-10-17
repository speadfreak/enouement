"use client";

/**
 * CinematicWordmark — the hero title object for "ENOUEMENT 2K27".
 *
 * Built as three stacked layers (outline / fill / glow) of the same text:
 *   1. Outline  — `-webkit-text-stroke` 1px transparent fill, muted stroke
 *   2. Fill     — flowing yellow→green→mint gradient (background-clip: text)
 *   3. Glow     — same gradient, blurred + low-opacity duplicate behind
 *
 * Behaviours:
 *   • Per-letter mask reveal on mount (translateY 110%→0, rotate, blur)
 *   • Single light-sweep pass across the text after reveal
 *   • Continuous flowing gradient (animated background-position)
 *   • Desktop: mouse parallax — fill follows most, glow least
 *   • Mobile: device-orientation parallax with iOS permission prompt fallback
 *     to a gentle CSS float
 *   • Per-letter hover (desktop): lift + brighten + glow
 *   • Occasional chromatic-aberration glitch on the outline layer
 *   • GSAP ScrollTrigger: scale 1→1.15, letter-spacing widens, opacity 1→0
 *     as the hero scrolls out of view
 *   • `prefers-reduced-motion`: static gradient text only
 */

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LINE_1 = "ENOUEMENT".split("");
const LINE_2 = "2K27".split("");

const PRIMARY = "#ffe600";
const SECONDARY = "#00c853";
const ACCENT = "#b9f6ca";

const GRADIENT_CSS = `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 35%, ${ACCENT} 62%, ${PRIMARY} 100%)`;

const REVEAL_BASE_DELAY = 0.35;
const REVEAL_STAGGER = 0.05;
const REVEAL_PER_LETTER_DURATION = 0.75;

const TOTAL_LETTERS = LINE_1.length + LINE_2.length;
const REVEAL_END =
  REVEAL_BASE_DELAY + TOTAL_LETTERS * REVEAL_STAGGER + REVEAL_PER_LETTER_DURATION;

const SWEEP_DURATION = 1.4;

/* ------------------------------------------------------------------ */
/*  Scoped CSS — injected once                                          */
/* ------------------------------------------------------------------ */

const CSS = `
@keyframes cw-gradient-flow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes cw-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
@keyframes cw-sweep-move {
  0%   { background-position-x: -150%; }
  100% { background-position-x: 250%; }
}

.cw-root {
  --cw-size-1: clamp(2.5rem, 12vw, 7.5rem);
  --cw-size-2-mobile: clamp(1.9rem, 9vw, 5rem);
  --cw-size-2-desktop: clamp(2rem, 10vw, 6.5rem);
  --cw-gap-mobile: 0.06em;
  --cw-gap-desktop: 0.4em;
  font-family: var(--font-display), "Syne", system-ui, sans-serif;
  font-weight: 800;
  line-height: 0.88;
  letter-spacing: -0.04em;
  user-select: none;
  -webkit-user-select: none;
  text-rendering: optimizeLegibility;
}

.cw-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cw-gap-mobile);
  position: relative;
}
@media (min-width: 768px) {
  .cw-stack {
    flex-direction: row;
    align-items: baseline;
    gap: var(--cw-gap-desktop);
  }
}

.cw-line {
  display: inline-flex;
  flex-wrap: nowrap;
  white-space: nowrap;
}
.cw-line-1 { font-size: var(--cw-size-1); }
.cw-line-2 { font-size: var(--cw-size-2-mobile); }
@media (min-width: 768px) {
  .cw-line-2 { font-size: var(--cw-size-2-desktop); }
}

.cw-letter-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  position: relative;
  /* headroom so hover-lift isn't clipped */
  padding-block: 0.1em;
  margin-block: -0.1em;
}

.cw-letter {
  display: inline-block;
  will-change: transform, filter;
  transition: transform 0.3s cubic-bezier(.22,1,.36,1), filter 0.3s ease;
}

/* Gradient fill layer */
.cw-fill {
  background: ${GRADIENT_CSS};
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: cw-gradient-flow 9s linear infinite;
  filter: drop-shadow(0 0 18px rgba(255, 230, 0, 0.35));
}

/* Outline layer */
.cw-outline {
  -webkit-text-stroke: 1px rgba(243, 255, 232, 0.22);
  -webkit-text-fill-color: transparent;
  color: transparent;
}
/* Glitch state — applied to outline layer's children when parent has .cw-glitching */
.cw-glitching .cw-outline {
  -webkit-text-stroke: 1px rgba(243, 255, 232, 0.05);
  text-shadow:
    -3px 0 0 rgba(255, 90, 120, 0.7),
     3px 0 0 rgba(80, 180, 255, 0.7);
}

/* Glow layer */
.cw-glow {
  background: ${GRADIENT_CSS};
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: blur(22px);
  opacity: 0.55;
  animation: cw-gradient-flow 9s linear infinite;
}

/* Light sweep (single span over each line — text-clipped) */
.cw-sweep {
  background: linear-gradient(110deg,
    transparent 35%,
    rgba(255, 255, 255, 0.95) 50%,
    transparent 65%);
  background-size: 300% 100%;
  background-position-x: -150%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: cw-sweep-move ${SWEEP_DURATION}s ease-out;
  animation-delay: ${REVEAL_END}s;
  animation-fill-mode: forwards;
}

/* Desktop hover lift on letters (fill layer only) */
@media (hover: hover) and (pointer: fine) {
  .cw-letter-interactive:hover {
    transform: translateY(-0.06em);
    filter: brightness(1.25) drop-shadow(0 0 12px rgba(255, 230, 0, 0.6));
  }
}

/* Touch: gentle per-letter float (fill layer only) */
@media (hover: none) {
  .cw-letter-interactive {
    animation: cw-float 4.2s ease-in-out infinite;
  }
}

/* Reduced motion: kill animations */
@media (prefers-reduced-motion: reduce) {
  .cw-fill, .cw-glow, .cw-sweep, .cw-letter-interactive {
    animation: none !important;
  }
  .cw-letter {
    transform: none !important;
    filter: none !important;
  }
}
`;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Layer = "fill" | "outline" | "glow";

type Props = {
  /** Ref to the hero <section>. Used as the ScrollTrigger trigger. */
  heroRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

/* ------------------------------------------------------------------ */
/*  Letter                                                             */
/* ------------------------------------------------------------------ */

function Letter({
  char,
  index,
  layer,
  interactive,
  reduced,
}: {
  char: string;
  index: number;
  layer: Layer;
  interactive: boolean;
  reduced: boolean;
}) {
  const delay = REVEAL_BASE_DELAY + index * REVEAL_STAGGER;
  const layerClass =
    layer === "fill" ? "cw-fill" : layer === "outline" ? "cw-outline" : "cw-glow";
  const interactiveClass =
    interactive && layer === "fill" ? "cw-letter-interactive" : "";

  if (reduced) {
    return (
      <span className="cw-letter-mask">
        <span className={`cw-letter ${layerClass} ${interactiveClass}`}>
          {char === " " ? "\u00A0" : char}
        </span>
      </span>
    );
  }

  return (
    <span className="cw-letter-mask">
      <motion.span
        className={`cw-letter ${layerClass} ${interactiveClass}`}
        initial={{ y: "110%", rotate: -8, opacity: 0, filter: "blur(12px)" }}
        animate={{ y: "0%", rotate: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{
          duration: REVEAL_PER_LETTER_DURATION,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Line                                                               */
/* ------------------------------------------------------------------ */

function Line({
  letters,
  startIndex,
  lineClass,
  layer,
  interactive,
  reduced,
}: {
  letters: string[];
  startIndex: number;
  lineClass: string;
  layer: Layer;
  interactive: boolean;
  reduced: boolean;
}) {
  return (
    <span className={`cw-line ${lineClass}`}>
      {letters.map((char, i) => (
        <Letter
          key={`${lineClass}-${i}`}
          char={char}
          index={startIndex + i}
          layer={layer}
          interactive={interactive}
          reduced={reduced}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Static fallback (reduced motion)                                   */
/* ------------------------------------------------------------------ */

function StaticWordmark() {
  return (
    <span className="cw-stack">
      <span className="cw-line cw-line-1">
        <span className="cw-letter cw-fill">{LINE_1.join("")}</span>
      </span>
      <span className="cw-line cw-line-2">
        <span className="cw-letter cw-fill">{LINE_2.join("")}</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export function CinematicWordmark({ heroRef, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [touch, setTouch] = useState(false);
  const [glitching, setGlitching] = useState(false);

  /* Pointer / tilt motion values (-1 .. 1) */
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  /* Per-layer parallax (±6px max) */
  const fillX = useSpring(useTransform(px, [-1, 1], [5, -5]), { stiffness: 90, damping: 18 });
  const fillY = useSpring(useTransform(py, [-1, 1], [5, -5]), { stiffness: 90, damping: 18 });
  const outlineX = useSpring(useTransform(px, [-1, 1], [-3, 3]), { stiffness: 70, damping: 16 });
  const outlineY = useSpring(useTransform(py, [-1, 1], [-3, 3]), { stiffness: 70, damping: 16 });
  const glowX = useSpring(useTransform(px, [-1, 1], [2, -2]), { stiffness: 55, damping: 14 });
  const glowY = useSpring(useTransform(py, [-1, 1], [2, -2]), { stiffness: 55, damping: 14 });

  /* ----- mount + capability detection ----- */
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const isTouch = window.matchMedia("(hover: none)").matches;
    setTouch(isTouch);

    if (mq.matches) return;

    let cleanup: (() => void) | undefined;

    function attachTilt() {
      const handler = (e: DeviceOrientationEvent) => {
        const g = e.gamma ?? 0; // -90..90 left-right
        const b = e.beta ?? 0; // -180..180 front-back
        const nx = Math.max(-1, Math.min(1, g / 25));
        const ny = Math.max(-1, Math.min(1, (b - 30) / 25));
        px.set(nx);
        py.set(ny);
      };
      window.addEventListener("deviceorientation", handler, { passive: true });
      const prev = cleanup;
      cleanup = () => {
        window.removeEventListener("deviceorientation", handler);
        prev?.();
      };
    }

    if (!isTouch) {
      /* Desktop: mouse parallax */
      const handle = (e: MouseEvent) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        px.set((e.clientX - w / 2) / (w / 2));
        py.set((e.clientY - h / 2) / (h / 2));
      };
      window.addEventListener("mousemove", handle, { passive: true });
      cleanup = () => window.removeEventListener("mousemove", handle);
    } else {
      /* Mobile: device orientation */
      const DOE = (window as unknown as {
        DeviceOrientationEvent?: {
          requestPermission?: () => Promise<"granted" | "denied">;
        };
      }).DeviceOrientationEvent;

      if (DOE && typeof DOE.requestPermission === "function") {
        /* iOS 13+ — request on first touch; if denied the CSS float remains */
        const tryEnable = async () => {
          try {
            const res = await DOE.requestPermission!();
            if (res === "granted") attachTilt();
          } catch {
            /* denied — fall back to CSS float */
          }
        };
        window.addEventListener("touchstart", tryEnable, { once: true });
        cleanup = () => window.removeEventListener("touchstart", tryEnable);
      } else if (DOE) {
        attachTilt();
      }
    }

    return () => cleanup?.();
  }, [px, py]);

  /* ----- chromatic-aberration glitch every 5-8s ----- */
  useEffect(() => {
    if (reduced) return;
    let active = true;
    const schedule = () => {
      const wait = 5000 + Math.random() * 3000;
      window.setTimeout(() => {
        if (!active) return;
        setGlitching(true);
        window.setTimeout(() => {
          if (!active) return;
          setGlitching(false);
          schedule();
        }, 150);
      }, wait);
    };
    schedule();
    return () => {
      active = false;
    };
  }, [reduced]);

  /* ----- GSAP scroll cinematics ----- */
  useEffect(() => {
    if (reduced || !mounted) return;
    const trigger = heroRef?.current ?? containerRef.current?.closest("section");
    const target = containerRef.current;
    if (!trigger || !target) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        { scale: 1, letterSpacing: "-0.04em", opacity: 1 },
        {
          scale: 1.15,
          letterSpacing: "0.08em",
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    }, trigger);

    return () => ctx.revert();
  }, [reduced, mounted, heroRef]);

  /* ----- render ----- */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={containerRef}
        className={`cw-root ${className}`}
        aria-label="Enouement 2K27"
        role="heading"
        aria-level={1}
      >
        {reduced ? (
          <StaticWordmark />
        ) : (
          <div className="relative inline-block">
            {/* GLOW LAYER (back) */}
            <motion.div
              className="cw-stack absolute inset-0 pointer-events-none"
              style={{ x: glowX, y: glowY }}
              aria-hidden
            >
              <Line
                letters={LINE_1}
                startIndex={0}
                lineClass="cw-line-1"
                layer="glow"
                interactive={false}
                reduced={reduced}
              />
              <Line
                letters={LINE_2}
                startIndex={LINE_1.length}
                lineClass="cw-line-2"
                layer="glow"
                interactive={false}
                reduced={reduced}
              />
            </motion.div>

            {/* OUTLINE LAYER (middle) — receives glitch class */}
            <motion.div
              className={`cw-stack absolute inset-0 pointer-events-none ${
                glitching ? "cw-glitching" : ""
              }`}
              style={{ x: outlineX, y: outlineY }}
              aria-hidden
            >
              <Line
                letters={LINE_1}
                startIndex={0}
                lineClass="cw-line-1"
                layer="outline"
                interactive={false}
                reduced={reduced}
              />
              <Line
                letters={LINE_2}
                startIndex={LINE_1.length}
                lineClass="cw-line-2"
                layer="outline"
                interactive={false}
                reduced={reduced}
              />
            </motion.div>

            {/* FILL LAYER (front — interactive) */}
            <motion.div
              className="cw-stack relative"
              style={{ x: fillX, y: fillY }}
            >
              <Line
                letters={LINE_1}
                startIndex={0}
                lineClass="cw-line-1"
                layer="fill"
                interactive={!touch}
                reduced={reduced}
              />
              <Line
                letters={LINE_2}
                startIndex={LINE_1.length}
                lineClass="cw-line-2"
                layer="fill"
                interactive={!touch}
                reduced={reduced}
              />
            </motion.div>

            {/* LIGHT SWEEP (text-clipped, single span per line) */}
            <motion.div
              className="cw-stack absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                delay: REVEAL_END,
                duration: SWEEP_DURATION,
                times: [0, 0.1, 0.9, 1],
                ease: "easeOut",
              }}
              aria-hidden
            >
              <span className="cw-line cw-line-1">
                <span className="cw-letter cw-sweep">{LINE_1.join("")}</span>
              </span>
              <span className="cw-line cw-line-2">
                <span className="cw-letter cw-sweep">{LINE_2.join("")}</span>
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

export default CinematicWordmark;
