"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

type Props = {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  once?: boolean;
};

/** Splits text into words and animates each with a mask reveal. */
export function AnimatedText({
  text,
  className = "",
  delay = 0,
  stagger = 0.06,
  as = "h2",
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px -10% 0px" });
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: "110%" },
    show: {
      y: "0%",
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const Tag = motion[as];

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      <Tag className="inline-block">
        {words.map((w, i) => (
          <span key={i} className="reveal-mask mr-[0.25em]">
            <motion.span variants={child} className="inline-block">
              {w}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}
