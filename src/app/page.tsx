import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Marquee } from "@/components/marquee";
import { AnimatedText } from "@/components/animated-text";
import { MagneticButton } from "@/components/magnetic-button";
import { Hero, type HeroSlide } from "@/components/hero/hero";
import { StatsCounter, type StatItem } from "@/components/home/stats-counter";
import { Highlights } from "@/components/home/highlights";
import { FeaturedGallery } from "@/components/home/featured-gallery";
import { LiveFeedPreview } from "@/components/home/live-feed-preview";
import {
  getSite,
  getHeroMedia,
  getPosts,
  getAnnouncements,
  getEvents,
  getStats,
} from "@/lib/data";
import { Users, CalendarDays, Camera, Film } from "lucide-react";

export const revalidate = 300;

/* ------------------------------------------------------------------ */
/*  CTA Section — full-width gradient finale                          */
/* ------------------------------------------------------------------ */
function CTASection({ siteName = "Énouement 2K27" }: { siteName?: string }) {
  return (
    <section
      aria-label="Enter the memory"
      className="relative overflow-hidden py-32 md:py-40"
    >
      {/* gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,230,0,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="aurora left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-primary/15"
      />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Step inside
        </span>

        <AnimatedText
          as="h2"
          text="Enter the memory."
          className="mt-6 block font-display text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
        />

        <AnimatedText
          as="p"
          text="Every chapter. Every face. Every story of the senior batch — preserved forever in one cinematic place."
          className="mx-auto mt-6 block max-w-2xl text-base text-foreground/70 sm:text-lg"
          stagger={0.025}
        />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagneticButton
            href="/story"
            className="bg-primary text-primary-foreground hover:glow-primary rounded-full px-9 py-4 text-sm font-semibold sm:px-10"
          >
            Begin the story
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </MagneticButton>
          <MagneticButton
            href="/seniors"
            strength={0.3}
            className="glass text-foreground hover:glow-primary rounded-full px-9 py-4 text-sm font-semibold sm:px-10"
          >
            Meet the seniors
          </MagneticButton>
        </div>

        <p className="mt-12 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {siteName} · Made with 💛💚
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/* ------------------------------------------------------------------ */
export default async function Home() {
  const [site, heroMedia, postsData, announcements, events, stats] =
    await Promise.all([
      getSite(),
      getHeroMedia(),
      getPosts(6),
      getAnnouncements(3),
      getEvents(),
      getStats(),
    ]);

  const slides: HeroSlide[] = (heroMedia ?? []).map((m) => ({
    id: m.id,
    url: m.url,
    title: m.title,
    duration: m.duration ?? 6000,
  }));

  // Next upcoming event
  const now = Date.now();
  const nextEvent =
    events.find((e) => new Date(e.startDate).getTime() > now) ?? events[0] ?? null;

  const statItems: StatItem[] = [
    {
      label: "Seniors",
      value: stats.students,
      suffix: "+",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Events",
      value: stats.events,
      suffix: "+",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      label: "Photos",
      value: stats.posts,
      suffix: "+",
      icon: <Camera className="h-5 w-5" />,
    },
    {
      label: "Videos",
      value: stats.videos,
      suffix: "+",
      icon: <Film className="h-5 w-5" />,
    },
  ];

  const countdownDate =
    site?.countdownDate ?? new Date("2027-06-26T09:00:00+03:00");
  const countdownLabel = site?.countdownLabel ?? "Graduation Day";

  return (
    <PageShell>
      <Hero
        slides={slides}
        countdownDate={countdownDate}
        countdownLabel={countdownLabel}
        tagline={
          site?.tagline ??
          "The Final Chapter — every moment, every face, every story of the senior batch, preserved forever."
        }
      />

      <Marquee
        text="CLASS OF 2027 · ETHIOPIA · ÉNOUEMENT 2K27"
        duration={32}
        className="border-y border-border/60 bg-background py-4"
      />

      <StatsCounter stats={statItems} />

      <Highlights announcements={announcements} nextEvent={nextEvent} />

      <FeaturedGallery posts={postsData.items} />

      <LiveFeedPreview posts={postsData.items.slice(0, 4)} />

      <CTASection siteName={site?.siteName} />
    </PageShell>
  );
}
