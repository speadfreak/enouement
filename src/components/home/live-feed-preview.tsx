import Link from "next/link";
import { ArrowRight, Clock, Heart } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import { SmartImage } from "@/components/smart-image";

type FeedPost = {
  id: string;
  caption: string;
  tags: string[];
  mediaUrls: string[];
  authorName: string;
  likeCount: number;
  createdAt: Date;
};

type Props = { posts: FeedPost[] };

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LiveFeedPreview({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-label="Live feed preview"
      className="relative overflow-hidden border-y border-border/60 bg-surface/40 py-24 md:py-32"
    >
      {/* aurora accents */}
      <div
        aria-hidden
        className="aurora left-[-10%] top-[-20%] h-72 w-72 bg-primary/20"
      />
      <div
        aria-hidden
        className="aurora right-[-10%] bottom-[-20%] h-72 w-72 bg-secondary/20"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              Live from the batch
            </span>
            <AnimatedText
              as="h2"
              text="The feed"
              className="mt-3 block font-display text-4xl font-bold sm:text-6xl"
            />
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Real-time moments posted by the batch. Pull, scroll, swipe — the
              story is still being written.
            </p>
          </div>
          <Link
            href="/moments"
            className="group inline-flex items-center gap-2 self-start rounded-full glass px-5 py-3 text-sm font-semibold transition hover:glow-primary sm:self-auto"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Open live feed
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {posts.map((p, i) => (
            <Link
              key={p.id}
              href="/moments"
              className="group relative w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border/60 glass sm:w-[340px]"
              aria-label={`View post: ${p.caption}`}
            >
              {/* image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <SmartImage
                  src={p.mediaUrls?.[0] ?? `/feed/feed-${(i % 6) + 1}.jpg`}
                  alt={p.caption}
                  fill
                  wrapperClassName="absolute inset-0"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  seed={p.id}
                  fallbackLabel={`Moment ${i + 1}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />

                {/* live badge */}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full glass-strong px-2.5 py-1 text-[0.6rem] uppercase tracking-wider text-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Live
                </div>

                {/* like count */}
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full glass-strong px-2.5 py-1 text-[0.65rem] text-foreground">
                  <Heart className="h-3 w-3 fill-primary text-primary" />
                  {p.likeCount}
                </div>

                {/* meta */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wide text-foreground/70">
                    <Clock className="h-3 w-3" />
                    {timeAgo(p.createdAt)}
                    <span className="text-muted-foreground">·</span>
                    <span className="truncate">{p.authorName}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {p.caption}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {/* trailing CTA card */}
          <Link
            href="/moments"
            className="group flex w-[200px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center transition hover:bg-primary/10 sm:w-[260px]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-110">
              <ArrowRight className="h-6 w-6" />
            </span>
            <span className="font-display text-lg font-bold text-foreground">
              See the full feed
            </span>
            <span className="text-xs text-muted-foreground">
              All moments, in real time.
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default LiveFeedPreview;
