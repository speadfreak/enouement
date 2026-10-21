"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, X, Sparkles, Clock, Film } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type VideoItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  posterUrl: string | null;
  category: string;
  duration: string | null;
  featured: boolean;
  createdAt: string;
};

type Props = {
  videos: VideoItem[];
};

/* Embed URL helper: ensure YouTube URLs are embeddable */
function toEmbed(url: string): string {
  // Already embed link
  if (/embed\/.+/.test(url)) return url;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([\w-]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // youtube.com/watch?v=ID
  const watch = url.match(/[?&]v=([\w-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return url;
}

/* ---------- Featured ---------- */
function FeaturedVideo({ video, onPlay }: { video: VideoItem; onPlay: () => void }) {
  return (
    <motion.button
      onClick={onPlay}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass hover:glow-primary group relative block w-full overflow-hidden rounded-3xl text-left"
      aria-label={`Play featured: ${video.title}`}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <SmartImage
          src={video.posterUrl ?? ""}
          alt={video.title}
          fill
          seed={video.id}
          fallbackLabel={video.title}
          wrapperClassName="!absolute inset-0"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 1024px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 sm:h-24 sm:w-24"
          >
            <Play className="h-7 w-7 translate-x-0.5 fill-current sm:h-9 sm:w-9" />
          </motion.span>
        </div>

        {/* Badges */}
        <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
          <Badge className="gap-1 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Featured
          </Badge>
          {video.category && (
            <Badge variant="secondary" className="rounded-full uppercase tracking-wider">
              {video.category}
            </Badge>
          )}
        </div>

        {/* Duration */}
        {video.duration && (
          <Badge
            variant="secondary"
            className="absolute bottom-4 right-4 gap-1 rounded-full sm:bottom-6 sm:right-6"
          >
            <Clock className="h-3 w-3" /> {video.duration}
          </Badge>
        )}

        {/* Title block */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8">
          <h2 className="font-display text-2xl font-extrabold leading-tight text-foreground drop-shadow sm:text-4xl md:text-5xl">
            {video.title}
          </h2>
          {video.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-2 sm:text-base">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ---------- Card ---------- */
function VideoCard({
  video,
  index,
  onPlay,
}: {
  video: VideoItem;
  index: number;
  onPlay: () => void;
}) {
  return (
    <motion.button
      onClick={onPlay}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.06, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="glass hover:glow-primary group block overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-0.5"
      aria-label={`Play: ${video.title}`}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <SmartImage
          src={video.posterUrl ?? ""}
          alt={video.title}
          fill
          seed={video.id}
          fallbackLabel={video.title}
          wrapperClassName="!absolute inset-0"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

        {/* Play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 sm:h-14 sm:w-14"
          >
            <Play className="h-4 w-4 translate-x-0.5 fill-current sm:h-5 sm:w-5" />
          </motion.span>
        </div>

        {/* Category */}
        {video.category && (
          <Badge
            variant="secondary"
            className="absolute left-3 top-3 rounded-full uppercase tracking-wider"
          >
            {video.category}
          </Badge>
        )}

        {/* Duration */}
        {video.duration && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 right-3 gap-1 rounded-full"
          >
            <Clock className="h-3 w-3" /> {video.duration}
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-base font-bold leading-tight sm:text-lg">
          {video.title}
        </h3>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            {video.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/* ---------- Player Dialog ---------- */
function PlayerDialog({
  video,
  onClose,
}: {
  video: VideoItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [video, onClose]);

  return (
    <Dialog open={!!video} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="glass-strong overflow-hidden rounded-3xl border-primary/30 p-0 sm:max-w-5xl"
      >
        {video && (
          <div className="flex flex-col">
            <div className="relative aspect-video w-full bg-black">
              <iframe
                key={video.id}
                src={toEmbed(video.url)}
                title={video.title}
                allow="accelerated-decoding; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <DialogTitle className="font-display text-xl font-bold leading-tight sm:text-2xl">
                    {video.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs uppercase tracking-[0.3em] text-primary">
                    <Film className="mr-1 inline h-3 w-3" />
                    {video.category} · Énouement 2K27
                  </DialogDescription>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close player"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full glass hover:glow-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {video.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {video.description}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Grid ---------- */
export function VideoGrid({ videos }: Props) {
  const [active, setActive] = useState<VideoItem | null>(null);

  const featured = useMemo(() => videos.find((v) => v.featured), [videos]);
  const rest = useMemo(
    () => videos.filter((v) => v.id !== featured?.id),
    [videos, featured]
  );

  if (videos.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl text-muted-foreground">
          No films uploaded yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Featured */}
      {featured && (
        <FeaturedVideo video={featured} onPlay={() => setActive(featured)} />
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <Film className="h-4 w-4 text-primary" />
            <h2 className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {featured ? "More Films" : "All Films"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((v, i) => (
              <VideoCard
                key={v.id}
                video={v}
                index={i}
                onPlay={() => setActive(v)}
              />
            ))}
          </div>
        </>
      )}

      {/* Player */}
      <PlayerDialog video={active} onClose={() => setActive(null)} />
    </div>
  );
}
