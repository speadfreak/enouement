"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  date: string | Date;
  label?: string;
  className?: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  diff: number;
};

function calcTime(target: number): TimeLeft {
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, diff: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    diff,
  };
}

function pad(n: number, min = 2) {
  return n >= 100 ? String(n) : String(n).padStart(min, "0");
}

function FlipDigit({ value }: { value: number }) {
  const display = pad(value);
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ y: "65%", opacity: 0, rotateX: -85 }}
          animate={{ y: "0%", opacity: 1, rotateX: 0 }}
          exit={{ y: "-65%", opacity: 0, rotateX: 85 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block tabular-nums"
          style={{ transformOrigin: "center" }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Countdown({ date, label = "Graduation Day", className = "" }: Props) {
  const target = new Date(date).getTime();
  const [t, setT] = useState<TimeLeft>(() => calcTime(target));

  useEffect(() => {
    const id = setInterval(() => setT(calcTime(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const expired = t.diff <= 0;

  if (expired) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-primary glow-primary" />
        <span className="font-display text-2xl font-bold text-gradient sm:text-3xl">
          The day is here.
        </span>
      </div>
    );
  }

  const units: { label: string; value: number }[] = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Mins", value: t.minutes },
    { label: "Secs", value: t.seconds },
  ];

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {label}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {units.map((u) => (
          <div
            key={u.label}
            className="glass relative flex flex-col items-center justify-center rounded-2xl px-2 py-4 sm:px-4 sm:py-5"
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
            <span className="font-mono text-3xl font-bold tabular-nums text-foreground sm:text-5xl">
              <FlipDigit value={u.value} />
            </span>
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Countdown;
