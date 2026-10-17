"use client";

/**
 * Cinematic smoky preloader for ENOUEMENT 2K27.
 *
 * Layers (back → front):
 *   1. Canvas smoke — ~36 large soft drifting radial-gradient blobs in
 *      yellow / green / mint tints, low alpha, slowly morphing. Capped at
 *      DPR 1.5 for 60 fps on mid-range mobile. Falls back to 4 CSS
 *      blurred radial-gradient divs on low-end hardware, and is skipped
 *      entirely on `prefers-reduced-motion` or `.reduce-effects` mode.
 *   2. Radial vignette (dark edges).
 *   3. Extra film grain (in addition to the global body grain).
 *   4. Center column:
 *        - Pulsing E2 brand badge
 *        - Wordmark "ENOUEMENT / 2K27" (font-display, fluid clamp)
 *            · Outline + glow + flowing yellow→green→mint gradient fill
 *            · Per-letter blur→sharp materialize (stagger 0.05 s)
 *            · Single light sweep pass after letters resolve
 *        - Slim 2 px glowing progress line + 3-digit counter
 *        - Rotating taglines (AnimatePresence crossfade every 600 ms)
 *        - Skip Intro button (bottom centre, 44 px target)
 *
 * Exit (no flat curtain):
 *   - Smoke drifts radially outward and fades
 *   - Wordmark flies forward (scale 1 → 1.4, y → -24, opacity 1 → 0)
 *   - Whole overlay fades to opacity 0
 *   - Duration 0.7 s, ease [0.76, 0, 0.24, 1]
 *
 * Session: shown once per session (sessionStorage `enouement_loaded`).
 * Total: ~2.2 s full, ~0.8 s reduced.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WORD_1 = "ENOUEMENT".split("");
const WORD_2 = "2K27".split("");

const TAGLINES = ["Class of 2027", "The Final Chapter", "Ethiopia", "Enouement 2K27"];
const TAGLINE_INTERVAL = 600; // ms

const TOTAL_DURATION = 2200; // ms — full mode
const REDUCED_DURATION = 800; // ms — reduced / low-effects mode

const EXIT_DURATION = 0.7; // s
const EXIT_DELAY_BUFFER = 0.06; // s — buffer before phase flips to done

const LETTER_BASE_DELAY = 0.15; // s
const LETTER_STAGGER = 0.05; // s per letter
const LETTER_DURATION = 0.55; // s
const TOTAL_LETTERS = WORD_1.length + WORD_2.length;
const LETTERS_END =
  LETTER_BASE_DELAY + TOTAL_LETTERS * LETTER_STAGGER + LETTER_DURATION;

const SWEEP_DURATION = 0.9; // s

const PRIMARY = "#ffe600";
const SECONDARY = "#00c853";
const ACCENT = "#b9f6ca";

const SESSION_KEY = "enouement_loaded";

/* ------------------------------------------------------------------ */
/*  Scoped CSS — injected once while the preloader is mounted            */
/* ------------------------------------------------------------------ */

const CSS = `
@keyframes pl-gradient-flow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes pl-sweep-anim {
  0%   { background-position-x: -150%; }
  100% { background-position-x: 250%; }
}
@keyframes pl-blob-drift-1 {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(80px, -50px, 0) scale(1.12); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes pl-blob-drift-2 {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(-70px, 40px, 0) scale(0.9); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes pl-blob-drift-3 {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(50px, 60px, 0) scale(1.08); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes pl-blob-drift-4 {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(-40px, -60px, 0) scale(0.94); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}

.pl-root {
  background: #050a07;
}

.pl-vignette {
  background: radial-gradient(ellipse at center, transparent 50%, rgba(5, 10, 7, 0.92) 100%);
}

.pl-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.08;
  mix-blend-mode: overlay;
}

.pl-wordmark {
  font-family: var(--font-display), "Syne", system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.88;
  user-select: none;
  -webkit-user-select: none;
  text-rendering: optimizeLegibility;
}

.pl-line-1 { font-size: clamp(2.5rem, 12vw, 7rem); }
.pl-line-2 {
  font-size: clamp(1.9rem, 9vw, 5rem);
  margin-top: 0.08em;
}
@media (min-width: 768px) {
  .pl-line-2 { margin-top: 0; }
}

.pl-letter {
  display: inline-block;
  will-change: transform, filter;
}

.pl-fill {
  background: linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 35%, ${ACCENT} 62%, ${PRIMARY} 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: pl-gradient-flow 9s linear infinite;
}

.pl-glow {
  background: linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 35%, ${ACCENT} 62%, ${PRIMARY} 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: blur(22px);
  opacity: 0.55;
  animation: pl-gradient-flow 9s linear infinite;
}

.pl-sweep-fill {
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
}
.pl-sweep-fill-active {
  animation: pl-sweep-anim ${SWEEP_DURATION}s ease-out forwards;
}

.pl-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  will-change: transform, opacity;
}
.pl-blob-1 { animation: pl-blob-drift-1 18s ease-in-out infinite; }
.pl-blob-2 { animation: pl-blob-drift-2 22s ease-in-out infinite; }
.pl-blob-3 { animation: pl-blob-drift-3 20s ease-in-out infinite; }
.pl-blob-4 { animation: pl-blob-drift-4 24s ease-in-out infinite; }

.pl-progress-fill {
  background: linear-gradient(90deg, ${PRIMARY}, ${SECONDARY}, ${ACCENT});
  box-shadow:
    0 0 8px rgba(255, 230, 0, 0.6),
    0 0 16px rgba(0, 200, 83, 0.45);
}

.pl-badge {
  background: linear-gradient(135deg, ${PRIMARY}, ${SECONDARY});
  color: #050a07;
  font-family: var(--font-display), "Syne", system-ui, sans-serif;
  font-weight: 800;
}

/* Respect global prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .pl-fill, .pl-glow, .pl-sweep-fill-active, .pl-blob {
    animation: none !important;
  }
}

/* Respect user-controlled .reduce-effects toggle (kills CSS animations
   and hides canvas, mirroring globals.css behaviour) */
.reduce-effects .pl-fill,
.reduce-effects .pl-glow,
.reduce-effects .pl-sweep-fill-active,
.reduce-effects .pl-blob {
  animation: none !important;
}
.reduce-effects .pl-canvas {
  display: none !important;
}
`;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = "idle" | "loading" | "exiting" | "done";

interface Smoke {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  morphPhase: number;
  morphSpeed: number;
  alpha: number;
  color: [number, number, number];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const pad3 = (n: number) =>
  String(Math.max(0, Math.min(100, Math.round(n)))).padStart(3, "0");

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Preloader() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [useBlobs, setUseBlobs] = useState(false);
  const [sweepActive, setSweepActive] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exitStartRef = useRef<number | null>(null);
  const loadedRef = useRef(false);
  const pendingCleanupRef = useRef<(() => void) | null>(null);

  /* ---- capability detection + start ---- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already shown this session — bail out immediately.
    if (sessionStorage.getItem(SESSION_KEY)) {
      setPhase("done");
      return;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hasReduceClass =
      document.documentElement.classList.contains("reduce-effects");
    const hw = (navigator.hardwareConcurrency ?? 8) < 4;
    const mem =
      ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) < 4;

    const isReduced = mq.matches || hasReduceClass;
    const isLowEnd = hw || mem;

    setReduced(isReduced);
    setUseCanvas(!isReduced && !isLowEnd);
    setUseBlobs(!isReduced && isLowEnd);

    const dur = isReduced ? REDUCED_DURATION : TOTAL_DURATION;

    setPhase("loading");

    const start = performance.now();
    let raf = 0;

    const triggerExit = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      setProgress(100);
      setPhase("exiting");
    };

    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / dur) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Page genuinely still loading? Hold at 100% until `load` fires.
        if (document.readyState === "complete") {
          triggerExit();
        } else {
          const onLoad = () => triggerExit();
          window.addEventListener("load", onLoad, { once: true });
          const safety = window.setTimeout(triggerExit, 3000);
          pendingCleanupRef.current = () => {
            window.removeEventListener("load", onLoad);
            window.clearTimeout(safety);
          };
        }
      }
    };
    raf = requestAnimationFrame(tick);

    // Schedule the single light-sweep pass after letters resolve.
    let sweepTimer: number | undefined;
    if (!isReduced) {
      sweepTimer = window.setTimeout(
        () => setSweepActive(true),
        LETTERS_END * 1000,
      );
    }

    return () => {
      cancelAnimationFrame(raf);
      if (sweepTimer !== undefined) window.clearTimeout(sweepTimer);
      pendingCleanupRef.current?.();
      pendingCleanupRef.current = null;
    };
  }, []);

  /* ---- tagline rotation (only while loading) ---- */
  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setInterval(() => {
      setTaglineIdx((i) => (i + 1) % TAGLINES.length);
    }, TAGLINE_INTERVAL);
    return () => window.clearInterval(id);
  }, [phase]);

  /* ---- exit → done ---- */
  useEffect(() => {
    if (phase !== "exiting") return;
    exitStartRef.current = performance.now();
    const id = window.setTimeout(
      () => {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* sessionStorage may be unavailable — ignore */
        }
        setPhase("done");
      },
      (EXIT_DURATION + EXIT_DELAY_BUFFER) * 1000,
    );
    return () => window.clearTimeout(id);
  }, [phase]);

  /* ---- skip handler ---- */
  const skip = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setProgress(100);
    setPhase("exiting");
  }, []);

  /* ---- canvas smoke effect (full mode only) ---- */
  const canvasEnabled =
    useCanvas && (phase === "loading" || phase === "exiting");
  useEffect(() => {
    if (!canvasEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const setup = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    setup();

    const COLORS: [number, number, number][] = [
      [255, 230, 0], // primary yellow
      [0, 200, 83], // secondary green
      [185, 246, 202], // accent mint
    ];

    const COUNT = 36;
    const particles: Smoke[] = Array.from({ length: COUNT }, () => {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 130 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        morphPhase: Math.random() * Math.PI * 2,
        morphSpeed: 0.0006 + Math.random() * 0.001,
        alpha: 0.06 + Math.random() * 0.09,
        color: c,
      };
    });

    let lastT = performance.now();
    let raf = 0;

    const draw = (t: number) => {
      const dt = Math.min(60, t - lastT);
      lastT = t;
      ctx.clearRect(0, 0, w, h);

      let exitP = 0;
      if (exitStartRef.current !== null) {
        exitP = Math.min(
          1,
          (t - exitStartRef.current) / (EXIT_DURATION * 1000),
        );
      }

      const cx = w / 2;
      const cy = h / 2;
      const step = dt / 16;

      for (const s of particles) {
        s.morphPhase += s.morphSpeed * dt;

        let vx = s.vx;
        let vy = s.vy;
        let alpha = s.alpha;

        if (exitP > 0) {
          // Smoke parts outward from center.
          const dx = s.x - cx;
          const dy = s.y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const push = exitP * 1.6;
          vx += (dx / dist) * push;
          vy += (dy / dist) * push;
          alpha = s.alpha * (1 - exitP);
        }

        s.x += vx * step;
        s.y += vy * step;

        const wrap = s.r * 1.2;
        if (s.x < -wrap) s.x = w + wrap;
        else if (s.x > w + wrap) s.x = -wrap;
        if (s.y < -wrap) s.y = h + wrap;
        else if (s.y > h + wrap) s.y = -wrap;

        const morphR = s.r * (0.9 + 0.15 * Math.sin(s.morphPhase));
        const a = Math.max(0, alpha * (1 - exitP * 0.5));
        if (a < 0.005) continue;

        const [r, g, b] = s.color;
        const grad = ctx.createRadialGradient(
          s.x,
          s.y,
          0,
          s.x,
          s.y,
          morphR,
        );
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, morphR, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [canvasEnabled]);

  /* ---- render ---- */
  if (phase === "idle" || phase === "done") return null;

  const exiting = phase === "exiting";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <motion.div
        className="pl-root fixed inset-0 z-[9998] overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        role="dialog"
        aria-label="Loading Enouement 2K27"
      >
        {/* ---------- smoke / blobs / nothing ---------- */}
        {useCanvas && (
          <canvas
            ref={canvasRef}
            className="pl-canvas absolute inset-0 h-full w-full"
            aria-hidden
          />
        )}
        {useBlobs && (
          <div className="absolute inset-0" aria-hidden>
            <div
              className="pl-blob pl-blob-1"
              style={{
                top: "8%",
                left: "4%",
                width: "55vw",
                height: "55vw",
                background:
                  "radial-gradient(circle, rgba(255,230,0,0.18), transparent 70%)",
              }}
            />
            <div
              className="pl-blob pl-blob-2"
              style={{
                top: "38%",
                right: "4%",
                width: "58vw",
                height: "58vw",
                background:
                  "radial-gradient(circle, rgba(0,200,83,0.16), transparent 70%)",
              }}
            />
            <div
              className="pl-blob pl-blob-3"
              style={{
                bottom: "4%",
                left: "18%",
                width: "62vw",
                height: "62vw",
                background:
                  "radial-gradient(circle, rgba(185,246,202,0.14), transparent 70%)",
              }}
            />
            <div
              className="pl-blob pl-blob-4"
              style={{
                top: "26%",
                left: "34%",
                width: "46vw",
                height: "46vw",
                background:
                  "radial-gradient(circle, rgba(255,230,0,0.1), transparent 70%)",
              }}
            />
          </div>
        )}

        {/* ---------- vignette ---------- */}
        <div
          className="pl-vignette pointer-events-none absolute inset-0"
          aria-hidden
        />

        {/* ---------- extra film grain ---------- */}
        <div
          className="pl-grain pointer-events-none absolute inset-0"
          aria-hidden
        />

        {/* ---------- center content ---------- */}
        <motion.div
          className="relative z-10 flex h-[100dvh] w-full flex-col items-center justify-center px-6 text-center"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
          animate={{
            scale: exiting ? 1.4 : 1,
            opacity: exiting ? 0 : 1,
            y: exiting ? -24 : 0,
          }}
          transition={{ duration: EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* ---- E2 brand badge ---- */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5, ease: "easeOut" }}
            className="mb-5 flex items-center justify-center"
          >
            <div className="pl-badge animate-pulse-glow flex h-11 w-11 items-center justify-center rounded-full text-base shadow-lg">
              E2
            </div>
          </motion.div>

          {/* ---- wordmark ---- */}
          <div className="relative inline-block">
            {/* glow layer (behind fill) — full mode only */}
            {!reduced && (
              <motion.div
                className="pointer-events-none absolute inset-0 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: LETTERS_END * 0.4, duration: 0.6 }}
                aria-hidden
              >
                <div className="pl-line-1 pl-wordmark pl-glow">
                  {WORD_1.join("")}
                </div>
                <div className="pl-line-2 pl-wordmark pl-glow">
                  {WORD_2.join("")}
                </div>
              </motion.div>
            )}

            {/* fill layer (front) with per-letter blur→sharp reveal */}
            <div className="relative flex flex-col items-center">
              <div
                className="pl-line-1 pl-wordmark pl-fill"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(255, 230, 0, 0.4))",
                }}
              >
                {WORD_1.map((c, i) => (
                  <motion.span
                    key={`w1-${i}`}
                    className="pl-letter"
                    initial={
                      reduced
                        ? { opacity: 0 }
                        : { opacity: 0, y: 20, filter: "blur(14px)" }
                    }
                    animate={
                      reduced
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, filter: "blur(0px)" }
                    }
                    transition={{
                      duration: reduced ? 0.4 : LETTER_DURATION,
                      delay: reduced
                        ? 0
                        : LETTER_BASE_DELAY + i * LETTER_STAGGER,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
              <div
                className="pl-line-2 pl-wordmark pl-fill"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(255, 230, 0, 0.4))",
                }}
              >
                {WORD_2.map((c, i) => (
                  <motion.span
                    key={`w2-${i}`}
                    className="pl-letter"
                    initial={
                      reduced
                        ? { opacity: 0 }
                        : { opacity: 0, y: 20, filter: "blur(14px)" }
                    }
                    animate={
                      reduced
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, filter: "blur(0px)" }
                    }
                    transition={{
                      duration: reduced ? 0.4 : LETTER_DURATION,
                      delay: reduced
                        ? 0.1
                        : LETTER_BASE_DELAY +
                          (WORD_1.length + i) * LETTER_STAGGER,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* light sweep (text-clipped, fires once after letters resolve) */}
            {!reduced && sweepActive && !exiting && (
              <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center"
                aria-hidden
              >
                <div className="pl-line-1 pl-wordmark pl-sweep-fill pl-sweep-fill-active">
                  {WORD_1.join("")}
                </div>
                <div className="pl-line-2 pl-wordmark pl-sweep-fill pl-sweep-fill-active">
                  {WORD_2.join("")}
                </div>
              </div>
            )}
          </div>

          {/* ---- progress line + 3-digit counter ---- */}
          <div className="mt-10 w-56 max-w-[80vw] sm:w-72">
            <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="pl-progress-fill absolute left-0 top-0 h-full rounded-full transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <span>Loading</span>
              <span className="font-mono tabular-nums text-primary">
                {pad3(progress)}
              </span>
            </div>
          </div>

          {/* ---- rotating tagline ---- */}
          <div className="mt-6 flex h-5 items-center justify-center text-[11px] uppercase tracking-[0.35em] text-foreground/70">
            <AnimatePresence mode="wait">
              <motion.span
                key={taglineIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="inline-block"
              >
                {TAGLINES[taglineIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ---- skip button (always reachable, min 44 px target) ---- */}
        <button
          onClick={skip}
          className="absolute left-1/2 min-h-[44px] -translate-x-1/2 px-6 text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-200 hover:text-foreground focus:outline-none focus-visible:text-foreground"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
        >
          Skip intro
        </button>
      </motion.div>
    </>
  );
}

export default Preloader;
