"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type StatItem = {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
};

type Props = { stats: StatItem[] };

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}
      <span className="text-primary">{suffix}</span>
    </span>
  );
}

export function StatsCounter({ stats }: Props) {
  return (
    <section
      aria-label="By the numbers"
      id="stats"
      className="border-y border-border/60 bg-surface/30 py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-start gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              The numbers
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 font-display text-4xl font-bold sm:text-6xl"
            >
              Four years,
              <br />
              <span className="text-gradient">in numbers.</span>
            </motion.h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            A snapshot of everything we built, attended, captured, and shared —
            and it's still growing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass group relative overflow-hidden rounded-3xl p-6 sm:p-8"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:bg-primary/20"
              />
              {s.icon && (
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/5 text-primary">
                  {s.icon}
                </div>
              )}
              <div className="relative font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
                {s.label}
              </div>
              <div className="mt-4 h-[2px] w-full overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 1.4, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left" }}
                  className="h-full w-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsCounter;
