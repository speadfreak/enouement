"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedText } from "@/components/animated-text";

type Props = {
  headline: string;
  intro: string;
  countdownDate: string | null;
};

function diff(target: number) {
  const now = Date.now();
  const total = Math.max(0, target - now);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const mins = Math.floor((total % 3600000) / 60000);
  const secs = Math.floor((total % 60000) / 1000);
  return { total, days, hours, mins, secs };
}

export function CountdownHero({ headline, intro, countdownDate }: Props) {
  const reduce = useReducedMotion();
  const target = countdownDate ? new Date(countdownDate).getTime() : null;

  const [time, setTime] = useState(() =>
    target ? diff(target) : { total: 0, days: 0, hours: 0, mins: 0, secs: 0 }
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!target) return;
    setTime(diff(target));
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const arrived = mounted && target !== null && time.total <= 0;
  const noDate = target === null;

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.mins },
    { label: "Seconds", value: time.secs },
  ];

  return (
    <section
      aria-label="Graduation countdown"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
    >
      {/* Animated glow background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute -left-32 top-1/4 h-[40rem] w-[40rem] rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,230,0,0.6) 0%, transparent 60%)",
            animation: reduce ? undefined : "float-glow 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 bottom-1/4 h-[44rem] w-[44rem] rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(0,200,83,0.55) 0%, transparent 60%)",
            animation: reduce
              ? undefined
              : "float-glow 18s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(185,246,202,0.55) 0%, transparent 60%)",
            animation: reduce ? undefined : "float-glow 22s ease-in-out infinite",
          }}
        />
        <style>{`
          @keyframes float-glow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(40px, -30px) scale(1.12); }
          }
        `}</style>
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          color: "var(--foreground)",
        }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.4em] text-primary"
        >
          Graduation Day
        </motion.p>

        <AnimatedText
          as="h1"
          text={headline}
          className="mt-6 break-words font-display text-5xl font-black leading-[0.9] tracking-tighter sm:text-7xl lg:text-9xl"
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          {intro}
        </motion.p>

        {/* Countdown */}
        <div className="mt-12">
          {noDate ? (
            <p className="text-lg text-muted-foreground">
              Date to be announced.
            </p>
          ) : arrived ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-xl"
            >
              <div className="glass-strong gradient-border rounded-2xl px-6 py-10">
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                  Today
                </p>
                <p className="mt-3 font-display text-4xl font-black text-gradient sm:text-5xl">
                  The day has arrived
                </p>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  We made it. The walk is here.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {units.map((u, i) => (
                <CountdownUnit
                  key={u.label}
                  label={u.label}
                  value={u.value}
                  delay={i * 0.08}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CountdownUnit({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const display = String(value).padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="glass relative overflow-hidden rounded-2xl px-2 py-6 sm:px-4"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="relative font-display text-4xl font-black tabular-nums text-foreground sm:text-6xl">
        <FlipDigit key={display} value={display} />
      </div>
      <div className="mt-2 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">
        {label}
      </div>
    </motion.div>
  );
}

function FlipDigit({ value }: { value: string }) {
  return (
    <span className="inline-flex overflow-hidden">
      {value.split("").map((d, i) => (
        <motion.span
          key={`${d}-${i}`}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {d}
        </motion.span>
      ))}
    </span>
  );
}
