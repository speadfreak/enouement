"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import { MagneticButton } from "@/components/magnetic-button";
import { SmartImage } from "@/components/smart-image";
import { Countdown } from "./countdown";

// 3D scene is dynamically imported with ssr:false to avoid SSR / three.js issues.
const HeroScene = dynamic(
  () => import("./hero-scene").then((m) => m.HeroScene),
  { ssr: false, loading: () => null }
);

export type HeroSlide = {
  id: string;
  url: string;
  title: string | null;
  duration: number;
};

type Props = {
  slides: HeroSlide[];
  countdownDate: string | Date;
  countdownLabel: string;
  tagline?: string;
};

export function Hero({
  slides,
  countdownDate,
  countdownLabel,
  tagline = "The Final Chapter — every moment, every face, every story of the senior batch, preserved forever.",
}: Props) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [sceneEnabled, setSceneEnabled] = useState(false);

  // Detect reduced-motion + low-end devices on mount.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = mq.matches;
    setReduced(isReduced);

    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
    const lowEnd = cores <= 4 || mem <= 4;
    setSceneEnabled(!isReduced && !lowEnd);
  }, []);

  // Crossfade slideshow.
  useEffect(() => {
    if (slides.length <= 1 || reduced) return;
    const dur = slides[index]?.duration ?? 6000;
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      Math.min(Math.max(dur, 4000), 9000)
    );
    return () => clearTimeout(id);
  }, [index, slides, reduced]);

  const safeSlides = slides.length > 0 ? slides : [
    { id: "fallback", url: "/hero/hero-1.jpg", title: "Enouement", duration: 6000 },
  ];
  const current = safeSlides[index % safeSlides.length];

  return (
    <section
      aria-label="Hero — Enouement 2K27"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* ------------------------------------------------------------ */}
      {/*  Background slideshow with ken-burns zoom                     */}
      {/* ------------------------------------------------------------ */}
      <div className="absolute inset-0 -z-20">
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id + index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: reduced ? 1 : 1.08 }}
              transition={{
                duration: (current.duration || 6000) / 1000,
                ease: "linear",
              }}
              className="absolute inset-0"
            >
              <SmartImage
                src={current.url}
                alt={current.title ?? "Enouement hero"}
                fill
                priority
                wrapperClassName="absolute inset-0"
                className="object-cover"
                seed={current.id}
                fallbackLabel={current.title ?? "ENOUEMENT 2K27"}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* legibility overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_0%,rgba(5,10,7,0.4)_70%)]" />
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  3D scene overlay — hidden on small screens / low-end         */}
      {/* ------------------------------------------------------------ */}
      <div className="absolute inset-0 -z-10 hidden md:block">
        <HeroScene enabled={sceneEnabled} />
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Content                                                       */}
      {/* ------------------------------------------------------------ */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* eyebrow */}
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] text-primary sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Class of 2027 · Ethiopia
          </motion.span>

          {/* MASSIVE title */}
          <h1 className="mt-6 font-display font-extrabold leading-[0.85] tracking-tight text-6xl sm:text-8xl lg:text-[9rem]">
            <AnimatedText
              text="ENOUEMENT"
              as="span"
              delay={0.4}
              stagger={0.09}
              className="block text-gradient glow-text"
            />
            <AnimatedText
              text="2K27"
              as="span"
              delay={0.95}
              stagger={0.05}
              className="mt-1 block text-foreground sm:mt-2"
            />
          </h1>

          {/* tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.7 }}
            className="mt-6 max-w-xl text-sm text-foreground/80 sm:text-lg"
          >
            {tagline}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <MagneticButton
              href="/story"
              className="bg-primary text-primary-foreground hover:glow-primary rounded-full px-7 py-4 text-sm font-semibold sm:px-8"
            >
              Enter the story
              <ArrowRight className="ml-2 h-4 w-4" />
            </MagneticButton>
            <MagneticButton
              href="/moments"
              strength={0.3}
              className="glass text-foreground hover:glow-primary rounded-full px-7 py-4 text-sm font-semibold sm:px-8"
            >
              <Play className="mr-2 h-3.5 w-3.5 fill-current" />
              Live moments
            </MagneticButton>
          </motion.div>
        </div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.95, duration: 0.8 }}
          className="mt-12 sm:mt-16 md:max-w-md"
        >
          <Countdown date={countdownDate} label={countdownLabel} />
        </motion.div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  Scroll indicator                                              */}
      {/* ------------------------------------------------------------ */}
      <motion.a
        href="#stats"
        aria-label="Scroll to explore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground sm:flex"
      >
        <span>Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block h-10 w-[1px] bg-gradient-to-b from-primary via-primary/60 to-transparent"
        />
      </motion.a>

      {/* slide indicator dots */}
      <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        {safeSlides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Slide ${i + 1}: ${s.title ?? ""}`}
            onClick={() => setIndex(i)}
            className="group relative h-2 w-2"
          >
            <span
              className={`absolute inset-0 rounded-full transition-all duration-500 ${
                i === index
                  ? "scale-100 bg-primary shadow-[0_0_10px_var(--glow)]"
                  : "scale-75 bg-foreground/30 group-hover:bg-foreground/60"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

export default Hero;
