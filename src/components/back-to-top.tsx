"use client";

/**
 * BackToTop — circular progress-ring button.
 *
 * A 48px circular button fixed at the bottom-right that:
 *   • Tracks the page scroll progress with an SVG ring
 *     (`stroke-dashoffset` mapped to `useScroll().scrollYProgress`).
 *   • Only appears once the user has scrolled past 700px.
 *   • Lifts on hover (`whileHover={{ y: -2 }}`) and shows a rocket/arrow.
 *   • Smooth-scrolls to the top on click.
 *   • Respects safe-area insets on iOS (`env(safe-area-inset-bottom)`).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { Rocket } from "lucide-react";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 113.1

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const strokeDashoffset = useTransform(progress, [0, 1], [CIRCUMFERENCE, 0]);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ y: -2, scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="glass-strong gradient-border fixed right-4 z-50 grid size-12 place-items-center rounded-full text-foreground shadow-lg"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          }}
        >
          {/* Progress ring */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 -rotate-90"
            width="48"
            height="48"
            viewBox="0 0 48 48"
          >
            {/* Track */}
            <circle
              cx="24"
              cy="24"
              r={RADIUS}
              fill="none"
              stroke="rgba(243, 255, 232, 0.12)"
              strokeWidth="2.5"
            />
            {/* Progress */}
            <motion.circle
              cx="24"
              cy="24"
              r={RADIUS}
              fill="none"
              stroke="url(#bt-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset }}
            />
            <defs>
              <linearGradient id="bt-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffe600" />
                <stop offset="50%" stopColor="#00c853" />
                <stop offset="100%" stopColor="#b9f6ca" />
              </linearGradient>
            </defs>
          </svg>
          <Rocket className="size-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default BackToTop;
