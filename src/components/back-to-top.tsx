"use client";

/**
 * BackToTop — insane floating circular progress-ring button (LEFT side).
 *
 * A 54px circular button FIXED at the bottom-LEFT that:
 *   • Appears after scrolling 300px (not just near footer — anywhere on page).
 *   • Tracks scroll progress with an SVG ring (stroke-dashoffset).
 *   • Has a pulsing glow halo + gradient border.
 *   • Uses Lenis scrollTo(0) for buttery animated scroll to top.
 *   • Lifts + glows on hover, scales on tap.
 *   • Respects safe-area insets on iOS.
 *   • High z-index so it's never hidden behind content.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";

const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 131.9

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const strokeDashoffset = useTransform(progress, [0, 1], [CIRCUMFERENCE, 0]);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 300);
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
          initial={{ opacity: 0, scale: 0.5, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: -20 }}
          whileHover={{ y: -3, scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="group glass-strong gradient-border fixed left-4 z-[80] grid size-[54px] place-items-center rounded-full text-foreground shadow-2xl"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          }}
        >
          {/* Pulsing glow halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
            style={{
              boxShadow: "0 0 28px -2px rgba(255,230,0,0.55), 0 0 56px -10px rgba(0,200,83,0.45)",
              animation: "bt-pulse 2.5s ease-in-out infinite",
            }}
          />
          {/* Progress ring */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 -rotate-90"
            width="54"
            height="54"
            viewBox="0 0 54 54"
          >
            {/* Track */}
            <circle
              cx="27"
              cy="27"
              r={RADIUS}
              fill="none"
              stroke="rgba(243, 255, 232, 0.1)"
              strokeWidth="2.5"
            />
            {/* Progress */}
            <motion.circle
              cx="27"
              cy="27"
              r={RADIUS}
              fill="none"
              stroke="url(#bt-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset }}
            />
            <defs>
              <linearGradient id="bt-grad" x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
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
