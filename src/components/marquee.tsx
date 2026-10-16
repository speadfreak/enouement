"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  duration?: number;
  reverse?: boolean;
  separator?: string;
};

export function Marquee({
  text,
  className,
  duration = 30,
  reverse = false,
  separator = "✦",
}: Props) {
  const items = Array.from({ length: 6 });
  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden border-y border-border/60 py-3",
        className
      )}
    >
      <div
        className="flex shrink-0 animate-marquee items-center"
        style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {items.map((_, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 font-display text-2xl font-bold uppercase tracking-tight text-foreground/80 sm:text-3xl">
              {text}
            </span>
            <span className="text-primary">{separator}</span>
          </span>
        ))}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 animate-marquee items-center"
        style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {items.map((_, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 font-display text-2xl font-bold uppercase tracking-tight text-foreground/80 sm:text-3xl">
              {text}
            </span>
            <span className="text-primary">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
