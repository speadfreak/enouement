"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  href?: string;
};

export function MagneticButton({ children, className = "", strength = 0.4, onClick, href }: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 12 });
  const sy = useSpring(y, { stiffness: 200, damping: 12 });

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const cls = `relative inline-flex items-center justify-center ${className}`;
  const motionProps = {
    ref: ref as any,
    style: { x: sx, y: sy },
    onMouseMove: onMove,
    onMouseLeave: reset,
    className: cls,
    onClick,
  };

  if (href) {
    return (
      <motion.a href={href} {...motionProps}>
        {children}
      </motion.a>
    );
  }
  return <motion.button {...motionProps}>{children}</motion.button>;
}
