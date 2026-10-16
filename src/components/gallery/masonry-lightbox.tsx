"use client";

import { useEffect, useCallback, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  type PanInfo,
} from "framer-motion";
import { X, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GalleryMedia = {
  id: string;
  url: string;
  type: string;
  title: string | null;
  width: number | null;
  height: number | null;
};

type AlbumLite = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  media: GalleryMedia[];
};

type Props = {
  album: AlbumLite | null;
  onClose: () => void;
};

const HEIGHTS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[4/3]", "aspect-[3/4]"];
function heightFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HEIGHTS[h % HEIGHTS.length];
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function MasonryLightbox({ album, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const x = useMotionValue(0);

  useEffect(() => {
    // Reset active item when album changes/closes
    setActiveIndex(-1);
  }, [album?.id]);

  /* Lock scroll when open */
  useEffect(() => {
    const open = !!album;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [album]);

  const goNext = useCallback(() => {
    if (!album) return;
    setActiveIndex((i) => Math.min(i + 1, album.media.length - 1));
  }, [album]);
  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }, []);

  /* Keyboard nav */
  useEffect(() => {
    if (!album || activeIndex < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeIndex >= 0) setActiveIndex(-1);
        else onClose();
      } else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [album, activeIndex, onClose, goNext, goPrev]);

  /* Reset swipe x when index changes */
  useEffect(() => {
    animate(x, 0, { duration: prefersReducedMotion ? 0 : 0.25 });
  }, [activeIndex, x]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold) goNext();
    else if (info.offset.x > threshold) goPrev();
    animate(x, 0, { duration: prefersReducedMotion ? 0 : 0.25 });
  };

  const activeMedia =
    album && activeIndex >= 0 ? album.media[activeIndex] : null;

  return (
    <AnimatePresence>
      {album && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Album viewer: ${album.title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-xl"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="rounded-full uppercase tracking-wider"
              >
                <Layers className="h-3 w-3" />
                {album.media.length} photos
              </Badge>
              <h2 className="font-display text-lg font-bold sm:text-xl">
                {album.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close album"
              className="flex h-10 w-10 items-center justify-center rounded-full glass-strong hover:glow-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Album description */}
          {album.description && (
            <p className="px-4 pb-3 text-sm text-muted-foreground sm:px-6">
              {album.description}
            </p>
          )}

          {/* Masonry */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [column-fill:_balance]">
              {album.media.map((m, i) => (
                <motion.button
                  key={m.id}
                  onClick={() => setActiveIndex(i)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(i * 0.04, 0.4),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    "glass hover:glow-primary group relative mb-3 block w-full overflow-hidden rounded-xl",
                    heightFor(m.id)
                  )}
                  aria-label={`Open image ${i + 1}`}
                >
                  <SmartImage
                    src={m.url}
                    alt={m.title ?? album.title}
                    fill
                    seed={m.id}
                    fallbackLabel={album.title}
                    wrapperClassName="!absolute inset-0"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-2 left-2 right-2 translate-y-1 text-left text-[10px] uppercase tracking-wider text-primary opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    View →
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Single viewer overlay */}
          <AnimatePresence>
            {activeMedia && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Photo viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col bg-background/95 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="text-primary">●</span>{" "}
                    {activeIndex + 1} / {album.media.length}
                  </span>
                  <button
                    onClick={() => setActiveIndex(-1)}
                    aria-label="Back to album"
                    className="flex h-10 w-10 items-center justify-center rounded-full glass-strong hover:glow-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
                  {activeIndex > 0 && (
                    <button
                      onClick={goPrev}
                      aria-label="Previous"
                      className="absolute left-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full glass-strong hover:glow-primary sm:flex sm:left-6"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {activeIndex < album.media.length - 1 && (
                    <button
                      onClick={goNext}
                      aria-label="Next"
                      className="absolute right-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full glass-strong hover:glow-primary sm:flex sm:right-6"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}

                  <motion.div
                    key={activeMedia.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    style={{ x }}
                    onDragEnd={onDragEnd}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full max-w-5xl"
                  >
                    <div className="relative h-full w-full">
                      <SmartImage
                        src={activeMedia.url}
                        alt={activeMedia.title ?? album.title}
                        fill
                        seed={activeMedia.id}
                        fallbackLabel={album.title}
                        wrapperClassName="!absolute inset-0"
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 80vw"
                        priority
                      />
                    </div>
                    {activeMedia.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4 text-center">
                        <p className="font-display text-sm text-foreground/90">
                          {activeMedia.title}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Mobile bottom nav */}
                <div className="flex items-center justify-between px-6 pb-6 sm:hidden">
                  <button
                    onClick={goPrev}
                    disabled={activeIndex === 0}
                    aria-label="Previous"
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full glass-strong",
                      activeIndex === 0 ? "opacity-30" : "hover:glow-primary"
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Swipe to navigate
                  </span>
                  <button
                    onClick={goNext}
                    disabled={activeIndex === album.media.length - 1}
                    aria-label="Next"
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full glass-strong",
                      activeIndex === album.media.length - 1
                        ? "opacity-30"
                        : "hover:glow-primary"
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
