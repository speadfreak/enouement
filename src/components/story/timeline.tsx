"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { AnimatedText } from "@/components/animated-text";
import { SmartImage } from "@/components/smart-image";

export type ChapterT = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string;
  coverUrl: string | null;
  year: string | null;
};

type Props = {
  chapters: ChapterT[];
};

export function Timeline({ chapters }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative">
      {/* Hero */}
      <section
        aria-label="Our story intro"
        className="relative px-4 pb-16 pt-32 sm:px-6 sm:pb-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-primary"
          >
            Our Story
          </motion.p>
          <AnimatedText
            as="h1"
            text="The Journey to 2K27"
            className="mt-4 font-display text-5xl font-extrabold leading-[0.92] sm:text-7xl lg:text-8xl"
          />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
          >
            A cinematic scroll through the chapters that shaped our senior batch.
            Every late night, every triumph, every laugh — the moments that
            carried us here.
          </motion.p>
        </div>
      </section>

      {/* Timeline */}
      <section
        aria-label="Story chapters"
        className="relative mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8"
      >
        {/* Center / side line */}
        <div
          aria-hidden
          className="absolute bottom-0 left-6 top-0 w-px bg-border md:left-1/2 md:-translate-x-1/2"
        >
          <motion.div
            className="w-px origin-top bg-gradient-to-b from-primary via-secondary to-accent"
            style={{ height: lineHeight as MotionValue<string> }}
          />
        </div>

        <div className="space-y-24 md:space-y-40">
          {chapters.map((ch, i) => (
            <Chapter key={ch.id} chapter={ch} index={i} reduce={!!reduce} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Chapter({
  chapter,
  index,
  reduce,
}: {
  chapter: ChapterT;
  index: number;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["10%", "-10%"]
  );
  const isLeft = index % 2 === 0;

  return (
    <article
      ref={ref}
      className="cv-auto relative overflow-hidden md:grid md:grid-cols-2 md:items-center md:gap-12 md:overflow-visible"
    >
      {/* Year backdrop */}
      {chapter.year ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05] md:opacity-[0.07]"
        >
          <span className="font-display text-[7rem] font-black leading-none sm:text-[10rem] lg:text-[16rem] xl:text-[22rem]">
            {chapter.year}
          </span>
        </div>
      ) : null}

      {/* Node on the center line */}
      <div
        aria-hidden
        className="absolute left-6 top-2 z-10 size-4 -translate-x-1/2 md:left-1/2 md:top-1/2 md:-translate-y-1/2"
      >
        <span className="absolute inset-0 animate-pulse rounded-full bg-primary shadow-[0_0_18px_4px_var(--glow)]" />
        <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-40" />
      </div>

      {/* Visual */}
      <motion.div
        style={{ y: reduce ? undefined : y }}
        className={`relative mb-8 overflow-hidden rounded-2xl border border-border md:mb-0 ${
          isLeft ? "md:order-1" : "md:order-2"
        }`}
      >
        <div className="relative aspect-video w-full">
          <SmartImage
            src={chapter.coverUrl ?? ""}
            alt={chapter.title}
            fill
            wrapperClassName="absolute inset-0"
            className="object-cover"
            seed={chapter.id}
            fallbackLabel={chapter.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          {chapter.year ? (
            <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur">
              {chapter.year}
            </span>
          ) : null}
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`relative pl-12 md:pl-0 ${
          isLeft ? "md:order-2 md:pl-12" : "md:order-1 md:pr-12 md:text-right"
        }`}
      >
        {chapter.subtitle ? (
          <p className="text-xs uppercase tracking-[0.25em] text-secondary">
            {chapter.subtitle}
          </p>
        ) : null}
        <AnimatedText
          as="h2"
          text={chapter.title}
          className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
        />
        <p className="mt-4 text-sm leading-relaxed text-foreground/80 sm:text-base">
          {chapter.body}
        </p>
      </motion.div>
    </article>
  );
}
