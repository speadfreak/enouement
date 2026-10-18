"use client";

/**
 * BackToTop — insane circular progress-ring button (right side).
 *
 * A 52px circular button fixed at the bottom-right that:
 *   • Tracks the page scroll progress with an SVG ring
 *     (`stroke-dashoffset` mapped to `useScroll().scrollYProgress`).
 *   • Only appears once the user has scrolled past 500px.
 *   • Has a pulsing glow halo when near the top of the page's bottom.
 *   • Lifts + glows on hover, scales down on tap.
 *   • Uses Lenis scrollTo(0) if available for buttery animated scroll,
 *     falls back to window.scrollTo({behavior:'smooth'}).
 *   • Respects safe-area insets on iOS.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 125.7

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const strokeDashoffset = useTransform(progress, [0, 1], [CIRCUMFERENCE, 0]);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const scrollToTop = () => {
    // Prefer Lenis for the insane smooth scroll; fall back to native
    const lenis = (window as unknown as { lenis?: { scrollTo: (t: number, o?: object) => void } }).lenis;
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.4, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ y: -3, scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="group glass-strong gradient-border fixed right-4 z-50 grid size-[52px] place-items-center rounded-full text-foreground shadow-xl"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          }}
        >
          {/* Pulsing glow halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
            style={{
              boxShadow: "0 0 24px -2px rgba(255,230,0,0.5), 0 0 48px -8px rgba(0,200,83,0.4)",
              animation: "bt-pulse 2.5s ease-in-out infinite",
            }}
          />
          {/* Progress ring */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 -rotate-90"
            width="52"
            height="52"
            viewBox="0 0 52 52"
          >
            {/* Track */}
            <circle
              cx="26"
              cy="26"
              r={RADIUS}
              fill="none"
              stroke="rgba(243, 255, 232, 0.1)"
              strokeWidth="2.5"
            />
            {/* Progress */}
            <motion.circle
              cx="26"
              cy="26"
              r={RADIUS}
              fill="none"
              stroke="url(#bt-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset }}
            />
            <defs>
              <linearGradient id="bt-grad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffe600" />
                <stop offset="50%" stopColor="#00c853" />
                <stop offset="100%" stopColor="#b9f6ca" />
              </linearGradient>
            </defs>
          </svg>
          <ArrowUp className="size-5 transition-transform group-hover:-translate-y-0.5" />
          {/* Inline keyframes for the pulse (scoped) */}
          <style>{`@keyframes bt-pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default BackToTop;
