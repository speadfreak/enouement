"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Pin, Sparkles, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SmartImage } from "@/components/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/moments/lightbox";
import { cn } from "@/lib/utils";

export type FeedPost = {
  id: string;
  caption: string;
  tags: string[];
  mediaUrls: string[];
  mediaType: string;
  pinned: boolean;
  published: boolean;
  authorName: string;
  likeCount: number;
  createdAt: string;
};

type Props = {
  initialItems: FeedPost[];
  initialCursor: string | null;
};

/* ---------- helpers ---------- */
const HEIGHTS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[4/3]", "aspect-[3/4]"];
function heightFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HEIGHTS[h % HEIGHTS.length];
}

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

const LIKE_KEY = "enouement:likes";

function getLikedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LIKE_KEY) || "{}");
  } catch {
    return {};
  }
}

/* ---------- Like button ---------- */
function LikeButton({ postId, baseCount }: { postId: string; baseCount: number }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(baseCount);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    const map = getLikedMap();
    if (map[postId]) {
      setLiked(true);
      setCount(baseCount + 1);
    } else {
      setLiked(false);
      setCount(baseCount);
    }
  }, [postId, baseCount]);

  const toggle = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      setCount((c) => c + (next ? 1 : -1));
      if (next) {
        setPopping(true);
        setTimeout(() => setPopping(false), 350);
      }
      const map = getLikedMap();
      if (next) map[postId] = true;
      else delete map[postId];
      try {
        localStorage.setItem(LIKE_KEY, JSON.stringify(map));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [postId]);

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className="group/like flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
    >
      <motion.span
        animate={{ scale: popping ? [1, 1.4, 1] : 1 }}
        transition={{ duration: 0.35 }}
        className="inline-flex"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition",
            liked ? "fill-primary text-primary" : "fill-none text-foreground/70 group-hover/like:text-primary"
          )}
        />
      </motion.span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

/* ---------- Card ---------- */
function Card({
  post,
  index,
  onOpen,
}: {
  post: FeedPost;
  index: number;
  onOpen: (id: string) => void;
}) {
  const cover = post.mediaUrls[0];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="glass hover:glow-primary group break-inside-avoid overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Media */}
      <button
        onClick={() => onOpen(post.id)}
        className="relative block w-full cursor-pointer overflow-hidden"
        aria-label={`Open post: ${post.caption}`}
      >
        <div className={cn("relative w-full", heightFor(post.id))}>
          <SmartImage
            src={cover}
            alt={post.caption}
            fill
            seed={post.id}
            fallbackLabel="Enouement 2K27"
            wrapperClassName="!absolute inset-0"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Pinned badge */}
        {post.pinned && (
          <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
            <Pin className="h-3 w-3" /> Pinned
          </Badge>
        )}

        {/* Media count badge */}
        {post.mediaUrls.length > 1 && (
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 gap-1 rounded-full"
          >
            <Sparkles className="h-3 w-3" /> {post.mediaUrls.length}
          </Badge>
        )}

        {/* Tap hint */}
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-primary">
            View moment →
          </span>
        </div>
      </button>

      {/* Body */}
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
          {post.caption}
        </p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="rounded-full border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                #{t}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {timeAgo(post.createdAt)}
          </span>
          <LikeButton postId={post.id} baseCount={post.likeCount} />
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- Feed ---------- */
export function Feed({ initialItems, initialCursor }: Props) {
  const [items, setItems] = useState<FeedPost[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(initialCursor !== null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* Live poll: just check the first page for new posts */
  const { data: freshData } = useQuery({
    queryKey: ["posts", "live"],
    queryFn: async () => {
      const res = await fetch(`/api/posts?limit=20`, { cache: "no-store" });
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { items: FeedPost[]; nextCursor: string | null };
    },
    refetchInterval: 20_000,
  });

  const knownIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const [newCount, setNewCount] = useState(0);
  const [newPreview, setNewPreview] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (!freshData) return;
    const fresh = freshData.items.filter((p) => !knownIds.has(p.id));
    if (fresh.length > 0) {
      setNewCount(fresh.length);
      setNewPreview(fresh.slice(0, 3));
    }
  }, [freshData, knownIds]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?cursor=${encodeURIComponent(cursor)}&limit=20`);
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { items: FeedPost[]; nextCursor: string | null };
      setItems((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...data.items.filter((p) => !existing.has(p.id))];
        return merged;
      });
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  const showNew = useCallback(() => {
    if (!freshData) return;
    setItems((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const merged = [
        ...freshData.items.filter((p) => !existing.has(p.id)),
        ...prev,
      ];
      return merged;
    });
    setNewCount(0);
    setNewPreview([]);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [freshData]);

  const activeIndex = items.findIndex((p) => p.id === activeId);

  return (
    <div className="relative">
      {/* New posts pill */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed left-1/2 top-20 z-40 -translate-x-1/2"
          >
            <button
              onClick={showNew}
              className="glass-strong flex items-center gap-3 rounded-full border border-primary/40 px-4 py-2 shadow-lg shadow-primary/20 hover:glow-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-sm font-medium">
                {newCount} new {newCount === 1 ? "moment" : "moments"}
              </span>
              {newPreview[0] && (
                <div className="flex -space-x-2">
                  {newPreview.map((p) => (
                    <span
                      key={p.id}
                      className="h-6 w-6 overflow-hidden rounded-full border-2 border-background"
                    >
                      <SmartImage
                        src={p.mediaUrls[0]}
                        alt=""
                        fill
                        wrapperClassName="!relative h-full w-full"
                        className="object-cover"
                        seed={p.id}
                        sizes="24px"
                      />
                    </span>
                  ))}
                </div>
              )}
              <ArrowUp className="h-3.5 w-3.5 rotate-45 text-primary" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masonry */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
        {items.map((post, i) => (
          <div key={post.id} className="mb-4 break-inside-avoid">
            <Card post={post} index={i} onOpen={setActiveId} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-muted-foreground">
            No moments yet. Check back soon.
          </p>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
            className="glass rounded-full border-primary/30 px-8 hover:glow-primary"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </>
            ) : (
              "Load more moments"
            )}
          </Button>
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div className="mt-12 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
            ✦ You've reached the start of our story ✦
          </p>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        items={items}
        index={activeIndex}
        onClose={() => setActiveId(null)}
        onIndexChange={(i) => setActiveId(items[i]?.id ?? null)}
      />
    </div>
  );
}
