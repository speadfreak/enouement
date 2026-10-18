"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ZapOff } from "lucide-react";

export function ReduceEffectsToggle({ className = "" }: { className?: string }) {
  const [reduce, setReduce] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("enouement-reduce-effects");
    if (stored === "1") setReduce(true);
    else if (stored === "0") setReduce(false);
    else {
      // Auto-detect low-end: few cores or low memory
      const cores = navigator.hardwareConcurrency || 4;
      const mem = (navigator as any).deviceMemory || 4;
      const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduce || cores < 4 || mem < 4) setReduce(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("enouement-reduce-effects", reduce ? "1" : "0");
    document.documentElement.classList.toggle("reduce-effects", reduce);
  }, [reduce, mounted]);

  const toggle = useCallback(() => setReduce((r) => !r), []);

  if (!mounted) return null;

  return (
    <button
      aria-label={reduce ? "Enable effects" : "Reduce effects"}
      onClick={toggle}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full glass transition hover:glow-primary ${className}`}
      title={reduce ? "Effects reduced — click to enable full effects" : "Full effects — click to reduce"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {reduce ? (
          <motion.span
            key="off"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25 }}
          >
            <ZapOff className="h-4 w-4 text-muted-foreground" />
          </motion.span>
        ) : (
          <motion.span
            key="on"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25 }}
          >
            <Zap className="h-4 w-4 text-primary" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
