import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { getPosts } from "@/lib/data";
import { Feed } from "@/components/moments/feed";

export const metadata: Metadata = {
  title: "Moments — Live Feed",
  description:
    "Live moments, in real time. The pulse of Enouement 2K27 — every post, every face, every feeling.",
};

export const dynamic = "force-dynamic";

export default async function MomentsPage() {
  const { items, nextCursor } = await getPosts(30);

  const serialized = items.map((p) => ({
    id: p.id,
    caption: p.caption,
    tags: p.tags,
    mediaUrls: p.mediaUrls,
    mediaType: p.mediaType,
    pinned: p.pinned,
    published: p.published,
    authorName: p.authorName,
    likeCount: p.likeCount,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div
          aria-hidden
          className="aurora"
          style={{
            width: 380,
            height: 380,
            top: -120,
            left: -100,
            background: "var(--primary)",
          }}
        />
        <div
          aria-hidden
          className="aurora"
          style={{
            width: 320,
            height: 320,
            bottom: -120,
            right: -80,
            background: "var(--secondary)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4">
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              Live Moments
            </span>
            <AnimatedText
              as="h1"
              text="The Feed of 2K27"
              className="font-display font-extrabold text-5xl sm:text-7xl"
            />
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              The pulse of our final year — captured as it happens. Tap a card to
              dive in, double-tap to like, swipe through to live the moment.
            </p>
          </div>
        </div>
      </section>

      <Marquee text="LIVE FEED" separator="●" duration={28} />

      {/* Feed */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Feed initialItems={serialized} initialCursor={nextCursor} />
        </div>
      </section>
    </PageShell>
  );
}
