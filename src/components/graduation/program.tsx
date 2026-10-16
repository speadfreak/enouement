"use client";

import { motion } from "framer-motion";
import { AnimatedText } from "@/components/animated-text";

type ProgramItem = {
  time?: string;
  title?: string;
  detail?: string;
};

type Props = {
  program: ProgramItem[];
};

export function Program({ program }: Props) {
  if (!program || program.length === 0) return null;

  return (
    <section
      aria-label="Graduation program"
      className="px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            The Order of Events
          </p>
          <AnimatedText
            as="h2"
            text="Graduation Program"
            className="mt-4 font-display text-4xl font-extrabold sm:text-5xl lg:text-6xl"
          />
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            From the first step into the hall to the final photograph — every
            moment of the day, in order.
          </p>
        </div>

        <ol className="relative mt-16 pl-8 sm:pl-12">
          {/* Vertical line */}
          <div
            aria-hidden
            className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-secondary to-accent sm:left-4"
          />
          {program.map((item, i) => (
            <ProgramRow key={i} item={item} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProgramRow({ item, index }: { item: ProgramItem; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative pb-10 last:pb-0"
    >
      {/* Node */}
      <span
        aria-hidden
        className="absolute -left-[1.55rem] top-1 size-3 rounded-full border-2 border-background bg-primary sm:-left-[2.05rem]"
      />

      <div className="glass gradient-border flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        {item.time ? (
          <div className="flex shrink-0 items-center gap-2 sm:w-32 sm:flex-col sm:items-start sm:gap-0.5">
            <span className="font-display text-2xl font-black tabular-nums text-primary sm:text-3xl">
              {item.time}
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground sm:mt-1">
              On the dot
            </span>
          </div>
        ) : null}

        <div className="flex-1">
          <h3 className="font-display text-xl font-bold sm:text-2xl">
            {item.title ?? "Untitled moment"}
          </h3>
          {item.detail ? (
            <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
              {item.detail}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-secondary">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden className="h-px w-6 bg-border" />
        </div>
      </div>
    </motion.li>
  );
}
