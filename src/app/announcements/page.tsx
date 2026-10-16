import type { Metadata } from "next";
import Link from "next/link";
import { Pin, ArrowUpRight, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";
import { AnnouncementsGrid } from "@/components/announcements/announcements-grid";
import { getAnnouncements } from "@/lib/data";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "News, announcements, and stories from the Enouement 2K27 senior batch.",
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function AnnouncementsPage() {
  const items = await getAnnouncements();

  // Split pinned/urgent (highlighted) from the rest.
  const highlighted = items.filter((a) => a.pinned || a.urgent);
  const rest = items.filter((a) => !(a.pinned || a.urgent));

  const categories = Array.from(
    new Set(items.map((a) => a.category).filter(Boolean))
  ).sort();

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div
          aria-hidden
          className="aurora -top-32 right-0 h-80 w-80 bg-secondary/30"
        />
        <div
          aria-hidden
          className="aurora -top-20 -left-24 h-72 w-72 bg-primary/30"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">News</p>
          <AnimatedText
            as="h1"
            text="Announcements & Stories"
            className="mt-4 font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight"
          />
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            The latest from the batch — schedules, calls, and the moments worth
            remembering. Pinned posts stay on top.
          </p>
        </div>
      </section>

      <Marquee text="Read All About It" className="text-primary" />

      {/* HIGHLIGHTED */}
      {highlighted.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-primary">
              Pinned &amp; urgent
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {highlighted.map((a) => {
                const d = new Date(a.publishAt);
                return (
                  <Link
                    key={a.id}
                    href={`/announcements/${a.slug}`}
                    className="group relative flex gap-4 overflow-hidden rounded-2xl glass p-4 transition-all duration-300 hover:-translate-y-1 hover:glow-primary sm:p-5"
                  >
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl sm:w-32">
                      <SmartImage
                        src={a.coverUrl ?? "/announcements/placeholder.jpg"}
                        alt={a.title}
                        fill
                        seed={a.slug}
                        fallbackLabel={a.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {a.urgent && (
                          <Badge className="bg-destructive text-white">
                            Urgent
                          </Badge>
                        )}
                        {a.pinned && (
                          <Badge variant="secondary" className="gap-1">
                            <Pin className="size-3" /> Pinned
                          </Badge>
                        )}
                        <Badge variant="outline">{a.category}</Badge>
                      </div>
                      <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                          {a.excerpt}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5 text-primary" />
                          {MONTHS_SHORT[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
                        </span>
                        <ArrowUpRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnnouncementsGrid items={rest} categories={categories} />
        </div>
      </section>
    </PageShell>
  );
}
