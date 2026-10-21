"use client";

/**
 * FooterCinematicWordmark — the finale's giant outlined "ÉNOUEMENT 2K27".
 *
 * The text starts as a muted outline (`-webkit-text-stroke`). As the user
 * scrolls toward the footer, the gradient fill rises from the bottom and
 * floods the letters (clip-path inset animates with `useScroll`).
 *
 * Layers (back → front):
 *   1. Glow        — same gradient, blurred + slow-moving, low opacity
 *   2. Outline     — `-webkit-text-stroke` 1px muted, transparent fill
 *   3. Gradient    — flowing yellow→green→mint gradient clipped to text,
 *                    revealed by scroll progress
 *
 * Extras:
 *   • Subtle mouse parallax (desktop) / device tilt (mobile, opt-in).
 *   • Grain overlay (inline SVG noise) — textured cinematic finish.
 *   • Fluid `clamp()` sizing so the text never overflows or wraps from
 *     360px → 1440px+.
 *   • `prefers-reduced-motion`: renders fully filled, no scroll tie.
 */

import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

const TEXT = "ÉNOUEMENT 2K27";

const PRIMARY = "#ffe600";
const SECONDARY = "#00c853";
const ACCENT = "#b9f6ca";
const GRADIENT_CSS = `linear-gradient(180deg, ${PRIMARY} 0%, ${SECONDARY} 55%, ${ACCENT} 100%)`;
const GRADIENT_FLOW = `linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 40%, ${ACCENT} 65%, ${PRIMARY} 100%)`;

const CSS = `
@keyframes fcw-flow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes fcw-glow-drift {
  0%, 100% { transform: translate3d(-2%, -1%, 0) scale(1.02); opacity: 0.45; }
  50%      { transform: translate3d(2%, 1%, 0) scale(1.05); opacity: 0.7; }
}

.fcw-root {
  position: relative;
  display: block;
  width: 100%;
  font-family: var(--font-display), "Syne", system-ui, sans-serif;
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.035em;
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
  text-rendering: optimizeLegibility;
  /* Fluid size: fits 360px (~40px) → 1440px+ (~150px) without wrap/overflow. */
  font-size: clamp(1.6rem, 11.5vw, 10.5rem);
}

.fcw-text {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}

/* All layers stack — the fill layer is the in-flow sizer; the rest are
   absolutely positioned over it so they overlap pixel-perfect. */
.fcw-layer {
  display: inline-block;
  white-space: nowrap;
}
.fcw-layer-abs {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Outline layer */
.fcw-outline {
  -webkit-text-stroke: 1px rgba(243, 255, 232, 0.28);
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Gradient fill layer (in-flow sizer) */
.fcw-fill {
  background: ${GRADIENT_FLOW};
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: fcw-flow 14s linear infinite;
}

/* Glow layer (blurred, drifting) */
.fcw-glow {
  background: ${GRADIENT_CSS};
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: blur(28px);
  animation: fcw-glow-drift 8s ease-in-out infinite;
  opacity: 0.55;
}

/* Grain overlay (clipped to text via background-clip so it only textures the
   letter shapes, not the surrounding footer area) */
.fcw-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 220px 220px;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  opacity: 0.22;
  mix-blend-mode: overlay;
}

@media (prefers-reduced-motion: reduce) {
  .fcw-fill { animation: none !important; }
  .fcw-glow { animation: none !important; opacity: 0.4; }
}
`;

export function FooterCinematicWordmark({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  /* scroll progress — fills the wordmark as it scrolls into view */
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start end", "center center"],
  });
  /* clip-path inset(bottom) — start hidden (100%), end revealed (0%) */
  const fillClipPath = useTransform(
    scrollYProgress,
    (v: number) => `inset(0 0 ${(1 - Math.min(1, Math.max(0, v / 0.9))) * 100}% 0)`
  );

  /* glow opacity ramps with scroll too */
  const glowOpacity = useTransform(scrollYProgress, [0, 0.7], [0.15, 0.7]);

  /* mouse / tilt parallax — small ±5px translate */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const fillX = useSpring(useTransform(px, [-1, 1], [5, -5]), { stiffness: 70, damping: 16 });
  const fillY = useSpring(useTransform(py, [-1, 1], [4, -4]), { stiffness: 70, damping: 16 });
  const outlineX = useSpring(useTransform(px, [-1, 1], [-3, 3]), { stiffness: 55, damping: 14 });
  const outlineY = useSpring(useTransform(py, [-1, 1], [-3, 3]), { stiffness: 55, damping: 14 });

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;

    const isTouch = window.matchMedia("(hover: none)").matches;

    let cleanup: (() => void) | undefined;

    if (!isTouch) {
      const handle = (e: MouseEvent) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        px.set((e.clientX - w / 2) / (w / 2));
        py.set((e.clientY - h / 2) / (h / 2));
      };
      window.addEventListener("mousemove", handle, { passive: true });
      cleanup = () => window.removeEventListener("mousemove", handle);
    } else {
      const attach = () => {
        const handler = (e: DeviceOrientationEvent) => {
          const g = e.gamma ?? 0;
          const b = e.beta ?? 0;
          px.set(Math.max(-1, Math.min(1, g / 25)));
          py.set(Math.max(-1, Math.min(1, (b - 30) / 25)));
        };
        window.addEventListener("deviceorientation", handler, { passive: true });
        const prev = cleanup;
        cleanup = () => {
          window.removeEventListener("deviceorientation", handler);
          prev?.();
        };
      };
      const DOE = (window as unknown as {
        DeviceOrientationEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
      }).DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        const tryEnable = async () => {
          try {
            const res = await DOE.requestPermission!();
            if (res === "granted") attach();
          } catch {
            /* denied — fall back to no parallax */
          }
        };
        window.addEventListener("touchstart", tryEnable, { once: true });
        cleanup = () => window.removeEventListener("touchstart", tryEnable);
      } else if (DOE) {
        attach();
      }
    }
    return () => cleanup?.();
  }, [px, py]);

  /* reduced motion: show fully filled, no scroll tie */
  const clipPathValue: MotionValue<string> | string = reduced || !mounted
    ? "inset(0 0 0% 0)"
    : fillClipPath;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={`fcw-root ${className}`}
        aria-label="ÉNOUEMENT 2K27"
        role="heading"
        aria-level={2}
      >
        <span className="fcw-text">
          {/* Glow layer (back) */}
          <motion.span
            aria-hidden
            className="fcw-layer fcw-layer-abs fcw-glow"
            style={reduced ? undefined : { opacity: glowOpacity, x: fillX, y: fillY }}
          >
            {TEXT}
          </motion.span>

          {/* Outline layer (middle) */}
          <motion.span
            aria-hidden
            className="fcw-layer fcw-layer-abs fcw-outline"
            style={reduced ? undefined : { x: outlineX, y: outlineY }}
          >
            {TEXT}
          </motion.span>

          {/* Gradient fill layer (front) — revealed by scroll, in-flow sizer */}
          <motion.span
            className="fcw-layer fcw-fill"
            style={{ clipPath: clipPathValue, WebkitClipPath: clipPathValue }}
          >
            {TEXT}
          </motion.span>

          {/* Grain overlay — clipped to letter shapes */}
          <span aria-hidden className="fcw-layer fcw-layer-abs fcw-grain">
            {TEXT}
          </span>
        </span>
      </div>
    </>
  );
}

export default FooterCinematicWordmark;
