"use client";

import { useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  type PanInfo,
} from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart, Tag } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Post = {
  id: string;
  caption: string;
  tags: string[];
  mediaUrls: string[];
  pinned: boolean;
  authorName: string;
  likeCount: number;
  createdAt: string;
};

type Props = {
  items: Post[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Lightbox({ items, index, onClose, onIndexChange }: Props) {
  const open = index >= 0 && index < items.length;
  const x = useMotionValue(0);

  const goNext = useCallback(() => {
    if (index < items.length - 1) onIndexChange(index + 1);
  }, [index, items.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  /* Keyboard nav */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev]);

  /* Lock body scroll */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Reset swipe position when index changes */
  useEffect(() => {
    animate(x, 0, { duration: prefersReducedMotion ? 0 : 0.25 });
  }, [index, x]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold) goNext();
    else if (info.offset.x > threshold) goPrev();
    animate(x, 0, { duration: prefersReducedMotion ? 0 : 0.25 });
  };

  const post = open ? items[index] : null;

  return (
    <AnimatePresence>
      {open && post && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Post viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-xl"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <span className="text-primary">●</span>
              <span>
                {index + 1} / {items.length}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full glass-strong hover:glow-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main viewer */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4">
            {/* Prev / Next arrows (desktop) */}
            {index > 0 && (
              <button
                onClick={goPrev}
                aria-label="Previous"
                className="absolute left-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full glass-strong hover:glow-primary sm:flex sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {index < items.length - 1 && (
              <button
                onClick={goNext}
                aria-label="Next"
                className="absolute right-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full glass-strong hover:glow-primary sm:flex sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <motion.div
              key={post.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              style={{ x }}
              onDragEnd={onDragEnd}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-full w-full max-w-5xl flex-col gap-4 sm:flex-row"
            >
              {/* Media */}
              <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl glass">
                <div className="relative h-full max-h-[85dvh] w-full">
                  <SmartImage
                    src={post.mediaUrls[0]}
                    alt={post.caption}
                    fill
                    seed={post.id}
                    fallbackLabel="Enouement 2K27"
                    wrapperClassName="!absolute inset-0"
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                  />
                </div>

                {post.pinned && (
                  <Badge className="absolute left-4 top-4 gap-1 rounded-full bg-primary text-primary-foreground">
                    <Heart className="h-3 w-3 fill-current" /> Pinned
                  </Badge>
                )}
              </div>

              {/* Caption panel */}
              <aside className="w-full shrink-0 space-y-4 overflow-y-auto p-1 sm:w-80 sm:p-4">
                <div className="space-y-2">
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
                    {post.authorName}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {timeAgo(post.createdAt)}
                  </p>
                </div>
                <p className="text-base leading-relaxed text-foreground">
                  {post.caption}
                </p>
                {post.tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <Tag className="h-3 w-3" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="rounded-full border-border/60 text-[10px] uppercase tracking-wider"
                        >
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 border-t border-border/40 pt-3 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 fill-primary text-primary" />
                  <span className="tabular-nums">{post.likeCount} likes</span>
                </div>
              </aside>
            </motion.div>
          </div>

          {/* Mobile bottom nav hint */}
          <div className="flex items-center justify-between px-6 pb-6 sm:hidden">
            <button
              onClick={goPrev}
              disabled={index === 0}
              aria-label="Previous"
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full glass-strong",
                index === 0 ? "opacity-30" : "hover:glow-primary"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Swipe to navigate
            </span>
            <button
              onClick={goNext}
              disabled={index === items.length - 1}
              aria-label="Next"
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full glass-strong",
                index === items.length - 1 ? "opacity-30" : "hover:glow-primary"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
