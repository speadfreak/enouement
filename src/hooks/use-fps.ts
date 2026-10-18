"use client";

/**
 * useFps
 * ------
 * Live FPS monitor that measures frame times via a single rAF loop and
 * auto-steps the performance tier DOWN when the page can't sustain ~45fps
 * for ~2 seconds. Steps are one-way: high → medium → low → off. The tier
 * only resets back UP when the initial tier prop changes (e.g. user
 * toggles the "Reduce effects" switch off, or unmounts and remounts the
 * hero on a route change).
 *
 * Pair with `usePerformanceTier()`:
 *
 *   const base = usePerformanceTier();
 *   const { tier, fps } = useFps(base);
 *
 * `tier` is what you should feed to `<HeroScene tier={tier} />`. It is
 * always ≤ `base` — never higher.
 *
 * The hook is a no-op rAF-wise on `low` / `off` base tiers (no need to
 * measure frames when we're already at the floor).
 */

import { useEffect, useRef, useState } from "react";
import type { PerformanceTier } from "./use-performance-tier";

// Stepped-down order, lowest first — used to find the next tier down.
const ORDER: PerformanceTier[] = ["off", "low", "medium", "high"];

type Options = {
  /** Smoothed-FPS threshold below which we count a "bad" frame. */
  minFps?: number;
  /** How long the smoothed FPS must stay below threshold before stepping down. */
  dwellMs?: number;
  /** Report interval for the exposed `fps` state (ms). */
  reportMs?: number;
};

type Result = {
  tier: PerformanceTier;
  fps: number;
};

export function useFps(
  initialTier: PerformanceTier,
  opts: Options = {},
): Result {
  const { minFps = 45, dwellMs = 2000, reportMs = 500 } = opts;

  const [tier, setTier] = useState<PerformanceTier>(initialTier);
  const [fps, setFps] = useState(60);

  const tierRef = useRef<PerformanceTier>(initialTier);
  const lowSinceRef = useRef<number | null>(null);

  useEffect(() => {
    // No need to measure if we're already at the floor — the hero won't
    // render 3D anyway, so an rAF loop here would only burn battery.
    if (initialTier === "low" || initialTier === "off") {
      tierRef.current = initialTier;
      lowSinceRef.current = null;
      setTier(initialTier);
      setFps(0);
      return;
    }

    // Reset to the new base tier on every (re)initialisation.
    tierRef.current = initialTier;
    lowSinceRef.current = null;
    setTier(initialTier);

    let raf = 0;
    let last = performance.now();
    let smooth = 60;
    let lastReport = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Instant FPS clamped to a sane range; avoid 0/Infinity on first tick.
      const instant = dt > 0 ? Math.min(120, 1000 / dt) : 60;
      // Exponential smoothing — keeps the signal stable, ignores one-off hiccups.
      smooth = smooth * 0.9 + instant * 0.1;

      // Throttle state writes so we don't re-render the consumer every frame.
      if (now - lastReport > reportMs) {
        lastReport = now;
        setFps(Math.round(smooth));
      }

      if (smooth < minFps) {
        if (lowSinceRef.current == null) {
          lowSinceRef.current = now;
        } else if (now - lowSinceRef.current > dwellMs) {
          // Step down one tier.
          const idx = ORDER.indexOf(tierRef.current);
          if (idx > 0) {
            tierRef.current = ORDER[idx - 1];
            setTier(tierRef.current);
          }
          // Reset the dwell window so we don't cascade-step in the same frame.
          lowSinceRef.current = null;
        }
      } else {
        lowSinceRef.current = null;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [initialTier, minFps, dwellMs, reportMs]);

  return { tier, fps };
}

export default useFps;
