"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("enouement_loaded")) {
      setProgress(100);
      setDone(true);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 2200;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / dur) * 100);
      setProgress(Math.round(p));
      if (p < 100) raf = requestAnimationFrame(tick);
      else {
        setTimeout(() => {
          setDone(true);
          sessionStorage.setItem("enouement_loaded", "1");
        }, 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const skip = () => {
    setSkipped(true);
    setProgress(100);
    setTimeout(() => {
      setDone(true);
      if (typeof window !== "undefined")
        sessionStorage.setItem("enouement_loaded", "1");
    }, 200);
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* curtain panels */}
          <motion.div
            className="absolute inset-x-0 top-0 bg-primary origin-top"
            initial={{ scaleY: 1 }}
            animate={done || skipped ? { scaleY: 0 } : { scaleY: 0 }}
            style={{ height: "50%", transformOrigin: "top" }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-secondary origin-bottom"
            initial={{ scaleY: 1 }}
            animate={done || skipped ? { scaleY: 0 } : { scaleY: 0 }}
            style={{ height: "50%", transformOrigin: "bottom" }}
          />

          {/* center content */}
          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="mb-3 text-[10px] font-medium uppercase tracking-[0.5em] text-muted-foreground"
            >
              Class of 2027 · Ethiopia
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-7xl md:text-8xl"
            >
              <span className="text-gradient">ENOUEMENT</span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, letterSpacing: "0.6em" }}
              animate={{ opacity: 1, letterSpacing: "0.2em" }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-2 font-display text-2xl font-bold text-foreground sm:text-4xl"
            >
              2K27
            </motion.div>

            {/* progress bar */}
            <div className="mt-10 h-[2px] w-56 overflow-hidden rounded-full bg-foreground/10 sm:w-72">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex w-56 items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground sm:w-72">
              <span>Loading</span>
              <span className="font-mono text-primary">{progress}%</span>
            </div>

            <button
              onClick={skip}
              className="mt-8 text-[11px] uppercase tracking-[0.3em] text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Skip intro
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
