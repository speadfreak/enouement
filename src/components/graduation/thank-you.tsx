"use client";

import { motion } from "framer-motion";
import { AnimatedText } from "@/components/animated-text";

type Props = {
  text: string | null;
};

export function ThankYou({ text }: Props) {
  return (
    <section
      aria-label="Thank you"
      className="px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong gradient-border relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20"
        >
          {/* Glow accents */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, var(--primary), transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, var(--secondary), transparent 60%)",
            }}
          />

          <p className="relative text-xs uppercase tracking-[0.4em] text-primary">
            With Gratitude
          </p>

          <AnimatedText
            as="h2"
            text="Thank You"
            className="relative mt-6 font-display text-5xl font-black leading-[0.92] sm:text-7xl lg:text-8xl"
          />

          {text ? (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto mt-8 max-w-2xl text-base leading-relaxed text-foreground/85 sm:text-lg"
            >
              {text}
            </motion.p>
          ) : null}

          <div className="relative mt-10 flex items-center justify-center gap-3 text-secondary">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-secondary" />
            <span aria-hidden className="text-2xl">
              ✦
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-secondary" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
