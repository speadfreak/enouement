import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { getAlbums } from "@/lib/data";
import { AlbumGrid } from "@/components/gallery/album-grid";

export const metadata: Metadata = {
  title: "Gallery — Frozen in Time",
  description:
    "Curated albums from the Enouement 2K27 journey. Each frame, a memory — each memory, a piece of us.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await getAlbums();

  const serialized = albums.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    coverUrl: a.coverUrl,
    category: a.category,
    order: a.order,
    createdAt: a.createdAt.toISOString(),
    media: a.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      title: m.title,
      width: m.width ?? null,
      height: m.height ?? null,
    })),
  }));

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div
          aria-hidden
          className="aurora"
          style={{
            width: 420,
            height: 420,
            top: -140,
            right: -120,
            background: "var(--secondary)",
          }}
        />
        <div
          aria-hidden
          className="aurora"
          style={{
            width: 300,
            height: 300,
            bottom: -120,
            left: -100,
            background: "var(--primary)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4">
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              Gallery
            </span>
            <AnimatedText
              as="h1"
              text="Frozen in Time"
              className="font-display font-extrabold text-5xl sm:text-7xl"
            />
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Curated frames from every chapter — sunrises, sports, cultural
              days, and the quiet moments in between. Tap an album to step
              inside.
            </p>
          </div>
        </div>
      </section>

      <Marquee text="CAPTURED FOREVER" separator="✦" duration={32} reverse />

      {/* Grid */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AlbumGrid albums={serialized} />
        </div>
      </section>
    </PageShell>
  );
}
