"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
            fallbackLabel="Énouement 2K27"
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
type LatestSignature = {
  latestId: string | null;
  latestCreatedAt: string | null;
  latestPinned: boolean;
  count: number;
};

export function Feed({ initialItems, initialCursor }: Props) {
  const [items, setItems] = useState<FeedPost[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(initialCursor !== null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* ---- visibility gating ----
   * Two layers:
   *   1. The browser tab must be visible (no polling in background tabs).
   *   2. The feed container must be on-screen (no polling when the user
   *      has scrolled away to the footer or another section).
   * When either is false, refetchInterval returns `false` (paused).
   */
  const [tabVisible, setTabVisible] = useState(true);
  const [feedInView, setFeedInView] = useState(true);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        // The feed is considered "in view" when ANY part of it is visible.
        const visible = entries.some((e) => e.isIntersecting);
        setFeedInView((prev) => (prev !== visible ? visible : prev));
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---- lightweight "is there anything new?" poll ----
   * Hits /api/posts/latest which returns ~80 bytes (id + createdAt +
   * count). If the signature differs from the topmost item we already
   * have, ONLY THEN do we fetch the full first page to surface the new
   * posts. This keeps the periodic poll cheap and bandwidth-friendly.
   */
  const topId = items[0]?.id;
  const topPinned = items[0]?.pinned ?? false;
  const knownCount = items.length;
  const pollShouldRun = tabVisible && feedInView;

  const { data: latestSig } = useQuery<LatestSignature>({
    queryKey: ["posts", "latest"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/latest`, { cache: "no-store" });
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as LatestSignature;
    },
    // 15s interval, but only when the tab AND the feed are visible.
    refetchInterval: () => (pollShouldRun ? 15_000 : false),
    refetchIntervalInBackground: false,
    // Mark as stale fast so visibility-recovery triggers an immediate poll.
    staleTime: 5_000,
  });

  // Decide whether we need to fetch the full first page based on the
  // latest signature vs. what we already have rendered.
  const hasNewPosts = useMemo(() => {
    if (!latestSig || !latestSig.latestId) return false;
    // New top post → either the id differs, or the pinned flag changed
    // (e.g. an existing post got pinned and should now bubble to top).
    if (latestSig.latestId !== topId) return true;
    if (latestSig.latestPinned !== topPinned) return true;
    // The count grew and our top item is no longer the latest (covered
    // by the id check above) — fall back to count delta as a safety net.
    if (latestSig.count > knownCount + 1) return true;
    return false;
  }, [latestSig, topId, topPinned, knownCount]);

  // Only fetch the full first page when the lightweight signature
  // indicates new content. This is what fills the "N new moments" pill.
  const { data: freshData } = useQuery({
    queryKey: ["posts", "fresh", latestSig?.latestId ?? "init"],
    queryFn: async () => {
      const res = await fetch(`/api/posts?limit=20`, { cache: "no-store" });
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { items: FeedPost[]; nextCursor: string | null };
    },
    // Pull fresh data only when the signature says there's something new,
    // AND only while the tab/feed are visible. Without this gate we'd be
    // re-running the heavy first-page fetch on every signature change.
    enabled: hasNewPosts && pollShouldRun,
    staleTime: 30_000,
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
    <div className="relative" ref={feedRef}>
      {/* New posts pill */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed left-1/2 top-20 z-40 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2"
          >
            <button
              onClick={showNew}
              className="glass-strong flex w-full items-center justify-center gap-3 rounded-full border border-primary/40 px-4 py-2 shadow-lg shadow-primary/20 hover:glow-primary"
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

      {/* Masonry — `cv-auto` on the container skips rendering of the whole
          grid when it's well below the fold (only the in/near-viewport portion
          renders). Applying it per-item in a CSS columns layout causes scroll
          jumps as items above the viewport re-render with actual heights
          different from the 500px placeholder, so we apply it to the wrapper. */}
      <div className="cv-auto columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
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
