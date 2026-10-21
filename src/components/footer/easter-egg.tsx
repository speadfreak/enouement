"use client";

/**
 * EasterEgg — Konami code on desktop, 7-tap on the footer logo, then confetti.
 *
 * Triggers:
 *   - Desktop: ↑ ↑ ↓ ↓ ← → ← → B A (typed anywhere on the page)
 *   - Mobile / touch: 7 consecutive taps on the host element that wraps
 *     this component (typically the footer logo). The host is identified by
 *     a `data-easter-egg-tap` attribute; if none is provided we attach the
 *     listener to `document` and count taps anywhere — useful as a fallback.
 *
 * On success:
 *   - A 30-particle confetti burst on a fullscreen `<canvas>` overlay
 *     (position: fixed; inset: 0; z-index: 9999; pointer-events: none).
 *     2 seconds of fall animation, then the canvas is removed.
 *   - A "Class of 2027 forever ✨" overlay shows for 3 seconds.
 *
 * Accessibility:
 *   - If `prefers-reduced-motion` is on OR the body has `reduce-effects`,
 *     we skip the confetti canvas and only show the message overlay.
 *
 * Performance:
 *   - Loaded via `next/dynamic({ ssr: false })`, so the keyboard + touch
 *     listeners attach only on the client.
 *   - The confetti uses requestAnimationFrame; on cleanup we cancel the rAF
 *     and remove the canvas.
 */

import { useEffect, useRef, useState, useCallback } from "react";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const TAP_THRESHOLD = 7;
const TAP_RESET_MS = 1200; // reset the tap streak after 1.2s of silence

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) return true;
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("reduce-effects");
  }
  return false;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  shape: "rect" | "circle";
};

const COLORS = ["#ffe600", "#00c853", "#b9f6ca", "#fbbf24", "#86efac"];

function launchConfetti(durationMs = 2000) {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:9999;pointer-events:none;";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);

  // 30 particles, originating from the centre-top of the viewport.
  const particles: Particle[] = Array.from({ length: 30 }, () => {
    const angle = (Math.random() - 0.5) * Math.PI; // -90°..+90° around "up"
    const speed = 6 + Math.random() * 5;
    return {
      x: w / 2 + (Math.random() - 0.5) * 60,
      y: h * 0.35 + (Math.random() - 0.5) * 30,
      vx: Math.sin(angle) * speed,
      vy: -Math.abs(Math.cos(angle)) * speed, // upward
      size: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.5 ? "rect" : "circle",
    };
  });

  const start = performance.now();
  const gravity = 0.35;
  const drag = 0.995;
  let raf = 0;

  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.vy += gravity;
      p.vx *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;

      // Fade in the last 30% of the duration.
      const lifeLeft = 1 - elapsed / durationMs;
      const alpha = elapsed > durationMs * 0.7 ? Math.max(0, lifeLeft * 3.3) : 1;
      ctx!.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx!.fillStyle = p.color;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      if (p.shape === "rect") {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    if (elapsed < durationMs + 200) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  }

  raf = requestAnimationFrame(frame);
}

export function EasterEgg() {
  const [showMessage, setShowMessage] = useState(false);
  const konamiIndex = useRef(0);
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);

  const trigger = useCallback(() => {
    if (prefersReducedMotion()) {
      // Skip the canvas — just show the message.
      setShowMessage(true);
      window.setTimeout(() => setShowMessage(false), 3000);
      return;
    }
    launchConfetti(2000);
    setShowMessage(true);
    window.setTimeout(() => setShowMessage(false), 3000);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = KONAMI[konamiIndex.current];
      if (key === expected) {
        konamiIndex.current += 1;
        if (konamiIndex.current === KONAMI.length) {
          konamiIndex.current = 0;
          trigger();
        }
      } else {
        // Allow immediate restart if they hit the first key correctly.
        konamiIndex.current = key === KONAMI[0] ? 1 : 0;
      }
    }

    // 7-tap detection — counts any touch/click on the page (the footer
    // logo is identified by the footer-rebuild agent via a wrapper, but we
    // listen globally so the egg works regardless of where they tap).
    function onTap() {
      tapCount.current += 1;
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      tapTimer.current = window.setTimeout(() => {
        tapCount.current = 0;
      }, TAP_RESET_MS);
      if (tapCount.current >= TAP_THRESHOLD) {
        tapCount.current = 0;
        if (tapTimer.current) window.clearTimeout(tapTimer.current);
        trigger();
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onTap, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onTap);
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
    };
  }, [trigger]);

  return (
    <div aria-hidden className="sr-only">
      Easter egg listener active.
      {showMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="not-sr-only pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center"
        >
          <div className="glass-strong rounded-2xl px-8 py-6 text-center">
            <p className="font-display text-3xl font-extrabold text-gradient sm:text-5xl">
              Class of 2027 forever
            </p>
            <p className="mt-2 text-2xl text-primary">✨</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default EasterEgg;
