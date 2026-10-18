"use client";

import { useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Images, Layers } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { Badge } from "@/components/ui/badge";
import { MasonryLightbox, type GalleryMedia } from "@/components/gallery/masonry-lightbox";
import { cn } from "@/lib/utils";

export type AlbumItem = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  category: string;
  order: number;
  createdAt: string;
  media: GalleryMedia[];
};

const CATEGORY_LABELS: Record<string, string> = {
  events: "Events",
  class: "Class",
  sports: "Sports",
  trips: "Trips",
  senior: "Senior",
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

/* ---------- 3D Tilt Card ---------- */
function TiltCard({
  album,
  onOpen,
  index,
}: {
  album: AlbumItem;
  onOpen: () => void;
  index: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 150,
    damping: 12,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), {
    stiffness: 150,
    damping: 12,
  });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    x.set(px);
    y.set(py);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.5), ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
    >
      <motion.button
        ref={ref}
        onClick={onOpen}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass hover:glow-primary group relative block w-full overflow-hidden rounded-2xl text-left transition-shadow"
        aria-label={`Open album: ${album.title}`}
      >
        {/* Cover */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <SmartImage
            src={album.coverUrl ?? album.media[0]?.url ?? ""}
            alt={album.title}
            fill
            seed={album.id}
            fallbackLabel={album.title}
            wrapperClassName="!absolute inset-0"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Category */}
          <div style={{ transform: "translateZ(40px)" }} className="absolute left-3 top-3">
            <Badge className="rounded-full bg-primary text-primary-foreground">
              {categoryLabel(album.category)}
            </Badge>
          </div>

          {/* Count */}
          <div style={{ transform: "translateZ(40px)" }} className="absolute right-3 top-3">
            <Badge variant="secondary" className="rounded-full">
              <Images className="h-3 w-3" /> {album.media.length}
            </Badge>
          </div>

          {/* Title block */}
          <div
            style={{ transform: "translateZ(50px)" }}
            className="absolute inset-x-0 bottom-0 p-4 sm:p-5"
          >
            <h3 className="font-display text-xl font-bold leading-tight text-foreground drop-shadow sm:text-2xl">
              {album.title}
            </h3>
            {album.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                {album.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Layers className="h-3.5 w-3.5" /> View album
            </div>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

/* ---------- Grid ---------- */
export function AlbumGrid({ albums }: { albums: AlbumItem[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    albums.forEach((a) => set.add(a.category));
    return ["all", ...Array.from(set)];
  }, [albums]);

  const [active, setActive] = useState<string>("all");
  const [openAlbum, setOpenAlbum] = useState<AlbumItem | null>(null);

  const filtered = useMemo(() => {
    if (active === "all") return albums;
    return albums.filter((a) => a.category === active);
  }, [albums, active]);

  return (
    <div className="space-y-8">
      {/* Filter chips — scrollable on touch/mouse, Lenis doesn't hijack */}
      <div
        className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-2"
        data-lenis-prevent
        style={{ overscrollBehavior: "contain" } as React.CSSProperties}
      >
        {categories.map((cat) => {
          const isActive = active === cat;
          const label = cat === "all" ? "All Albums" : categoryLabel(cat);
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="album-chip"
                  className="absolute inset-0 -z-10 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {!isActive && (
                <span className="absolute inset-0 -z-10 rounded-full glass" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((album, i) => (
            <TiltCard
              key={album.id}
              album={album}
              index={i}
              onOpen={() => setOpenAlbum(album)}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-muted-foreground">
            No albums in this category yet.
          </p>
        </div>
      )}

      {/* Lightbox */}
      <MasonryLightbox
        album={openAlbum}
        onClose={() => setOpenAlbum(null)}
      />
    </div>
  );
}
