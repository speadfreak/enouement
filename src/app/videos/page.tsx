import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { getVideos } from "@/lib/data";
import { VideoGrid } from "@/components/videos/video-grid";

// ISR: regenerate at most every 60s. Cached reads (tag "videos", revalidate 60).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cinema — Moving Memories",
  description:
    "Moving memories from the Énouement 2K27 journey. Watch the moments that defined us — frame by frame.",
};


export default async function VideosPage() {
  const videos = await getVideos();

  const serialized = videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    url: v.url,
    posterUrl: v.posterUrl,
    category: v.category,
    duration: v.duration,
    featured: v.featured,
    createdAt: new Date(v.createdAt).toISOString(),
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
            background: "var(--secondary)",
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
            background: "var(--primary)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4">
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              Cinema
            </span>
            <AnimatedText
              as="h1"
              text="Moving Memories"
              className="font-display font-extrabold text-5xl sm:text-7xl"
            />
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              The story of our final year — in motion. Trailers, recaps, and
              the moments that deserved more than a still frame.
            </p>
          </div>
        </div>
      </section>

      <Marquee text="NOW SHOWING" separator="▶" duration={28} />

      {/* Grid */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <VideoGrid videos={serialized} />
        </div>
      </section>
    </PageShell>
  );
}
