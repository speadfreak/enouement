"use client";

/**
 * LiveCounter — "Visits this month: N" with a count-up animation.
 *
 * Behaviour:
 *   - The count is passed in as a prop (`count`) by the footer (which reads
 *     it from the SSR seed of the VisitCounter row).
 *   - When the component scrolls into view, the displayed number animates
 *     from 0 → count using framer-motion's `animate()` over ~1.8s.
 *   - On mount (client-side), we fire a one-shot POST to `/api/visit` to
 *     record this visit. The result is ignored unless it's higher than the
 *     SSR seed, in which case we bump the target so the counter can climb
 *     live. Rate-limited per IP per hour on the server, so this is safe to
 *     call on every page load.
 *
 * Performance:
 *   - Loaded via `next/dynamic({ ssr: false })`, so the framer-motion `animate`
 *     import + useInView don't land in the first-load bundle.
 *   - Only animates transform/opacity (well, just the digit text — no layout).
 */

import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

type Props = {
  count: number;
  className?: string;
};

export function LiveCounter({ count, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(0);
  const [target, setTarget] = useState(count);

  // Fire-and-forget visit recording on mount.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/visit", {
      method: "POST",
      signal: ctrl.signal,
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (typeof data?.count === "number" && data.count > target) {
          setTarget(data.count);
        }
      })
      .catch(() => {
        /* silent — visit recording is best-effort */
      });
    return () => ctrl.abort();
  }, [target]);

  // Animate the digit when in view (or when target bumps).
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm ${className}`}
    >
      <Eye className="h-4 w-4 text-primary" />
      <span className="text-muted-foreground">Visits this month:</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {display.toLocaleString()}
      </span>
    </motion.div>
  );
}

export default LiveCounter;
