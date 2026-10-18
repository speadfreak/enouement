"use client";

/**
 * usePerformanceTier
 * ------------------
 * Static, capability-based performance classification for the device the
 * site is currently running on. Returns one of:
 *
 *   "high"   — 8+ cores, ≥ 8 GB RAM, fast network            → full 3D
 *   "medium" — 4-7 cores or 4-8 GB RAM                      → reduced 3D
 *   "low"    — <4 cores, <4 GB, slow network, reduced motion
 *              or `.reduce-effects` class on <html>          → no 3D, CSS only
 *   "off"    — only ever returned by the FPS monitor once a
 *              tier has been auto-stepped all the way down.
 *
 * The hook re-computes when:
 *   • the `prefers-reduced-motion` media query changes
 *   • the `.reduce-effects` class is toggled on <html> (the navbar
 *     "Reduce effects" switch does this)
 *
 * It is intentionally a STATIC signal — it does not react to live frame
 * drops. Pair with `useFps()` for runtime adaptive degradation.
 */

import { useEffect, useState } from "react";

export type PerformanceTier = "high" | "medium" | "low" | "off";

type NetworkInfo = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithDevice = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInfo;
};

function clampLow(t: PerformanceTier): PerformanceTier {
  return t === "high" ? "medium" : t === "medium" ? "low" : t;
}

function computeTier(): PerformanceTier {
  if (typeof window === "undefined") return "high";

  const html = document.documentElement;
  const reduceClass = html.classList.contains("reduce-effects");
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceClass || mqReduce) return "low";

  const nav = navigator as NavigatorWithDevice;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const conn = nav.connection;

  let tier: PerformanceTier;
  if (cores < 4 || mem < 4) tier = "low";
  else if (cores < 8 || mem < 8) tier = "medium";
  else tier = "high";

  // Network hints — only ever push tier DOWN, never up.
  if (conn?.effectiveType) {
    const et = conn.effectiveType;
    if (et === "slow-2g" || et === "2g") {
      tier = "low";
    } else if (et === "3g") {
      tier = clampLow(tier);
    } else if (et === "4g" && conn.saveData) {
      tier = clampLow(tier);
    }
  }

  return tier;
}

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>("high");

  useEffect(() => {
    setTier(computeTier());

    const recompute = () => setTier(computeTier());

    // Track prefers-reduced-motion changes.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", recompute);

    // Track the `.reduce-effects` class toggle on <html>.
    const observer = new MutationObserver(recompute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Track effective network type changes (mobile only).
    const nav = navigator as NavigatorWithDevice;
    const conn = nav.connection;
    conn?.addEventListener?.("change", recompute);

    return () => {
      mq.removeEventListener("change", recompute);
      observer.disconnect();
      conn?.removeEventListener?.("change", recompute);
    };
  }, []);

  return tier;
}

export default usePerformanceTier;
