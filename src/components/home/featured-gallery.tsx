"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, Heart, Images, Tag } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import { SmartImage } from "@/components/smart-image";

export type GalleryPost = {
  id: string;
  caption: string;
  tags: string[];
  mediaUrls: string[];
  likeCount: number;
  createdAt: Date;
};

type Props = { posts: GalleryPost[] };

const ASPECTS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[1/1]",
];

function TiltCard({ post, aspect, index }: { post: GalleryPost; aspect: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });

  // subtle lift transform
  const transform = useTransform(
    [srx, sry],
    ([x, y]: number[]) =>
      `perspective(900px) rotateX(${x}deg) rotateY(${y}deg) translateZ(0)`
  );

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 12);
    rx.set(-py * 12);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const image = post.mediaUrls?.[0] ?? `/feed/feed-${(index % 6) + 1}.jpg`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative break-inside-avoid"
    >
      <Link
        href="/moments"
        className="block"
        aria-label={`Moment: ${post.caption}`}
      >
        <div
          className={`relative w-full overflow-hidden rounded-2xl border border-border/60 ${aspect}`}
        >
          <SmartImage
            src={image}
            alt={post.caption}
            fill
            wrapperClassName="absolute inset-0"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            seed={post.id}
            fallbackLabel={`#${index + 1}`}
          />

          {/* gradient + content overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-70 transition group-hover:opacity-90" />

          {/* tags */}
          {post.tags?.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-foreground/80"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* like count */}
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full glass px-2 py-0.5 text-[0.65rem] text-foreground/80">
            <Heart className="h-2.5 w-2.5 fill-primary text-primary" />
            {post.likeCount}
          </div>

          {/* caption */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="line-clamp-2 text-sm font-medium text-foreground">
              {post.caption}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
              View moment
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturedGallery({ posts }: Props) {
  return (
    <section
      aria-label="Featured gallery — recent moments"
      className="py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              From the feed
            </span>
            <AnimatedText
              as="h2"
              text="Featured moments"
              className="mt-3 block font-display text-4xl font-bold sm:text-6xl"
            />
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              A glimpse into the in-between — the laughs, the late nights, the
              days that became memories.
            </p>
          </div>
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-2 self-start rounded-full glass px-5 py-3 text-sm font-semibold transition hover:glow-primary sm:self-auto"
          >
            <Images className="h-4 w-4 text-primary" />
            Full gallery
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 [&>*]:mb-4 sm:[&>*]:mb-5">
          {posts.map((p, i) => (
            <TiltCard
              key={p.id}
              post={p}
              aspect={ASPECTS[i % ASPECTS.length]}
              index={i}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/moments"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:glow-primary"
          >
            See all moments
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedGallery;
