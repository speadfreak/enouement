import Link from "next/link";
import { ArrowUpRight, CalendarDays, Megaphone, Pin } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import { Countdown } from "@/components/hero/countdown";
import { SmartImage } from "@/components/smart-image";

type Announcement = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  pinned: boolean;
  urgent: boolean;
  publishAt: Date;
  coverUrl: string | null;
};

type NextEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  coverUrl: string | null;
};

type Props = {
  announcements: Announcement[];
  nextEvent: NextEvent | null;
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function Highlights({ announcements, nextEvent }: Props) {
  return (
    <section
      aria-label="Latest announcements and next event"
      className="py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              Fresh off the press
            </span>
            <AnimatedText
              as="h2"
              text="Highlights"
              className="mt-3 block font-display text-4xl font-bold sm:text-6xl"
            />
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 self-start text-sm text-muted-foreground transition hover:text-primary sm:self-auto"
          >
            See all events
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Next event card — spans 1 col on lg */}
          {nextEvent ? (
            <div className="gradient-border relative overflow-hidden rounded-3xl p-6 sm:p-7">
              <div className="absolute inset-0 -z-10 opacity-40">
                <SmartImage
                  src={nextEvent.coverUrl ?? "/events/event-1.jpg"}
                  alt={nextEvent.title}
                  fill
                  wrapperClassName="absolute inset-0"
                  className="object-cover"
                  seed={nextEvent.id}
                  fallbackLabel={nextEvent.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/40" />
              </div>

              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
                <CalendarDays className="h-3.5 w-3.5" />
                Next event
              </div>

              <h3 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                {nextEvent.title}
              </h3>

              {nextEvent.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {nextEvent.description}
                </p>
              )}

              {nextEvent.location && (
                <p className="mt-3 text-xs uppercase tracking-wider text-foreground/60">
                  📍 {nextEvent.location}
                </p>
              )}

              <div className="mt-6">
                <Countdown
                  date={nextEvent.startDate}
                  label={`${fmtDate(nextEvent.startDate)}`}
                />
              </div>

              <Link
                href={`/events/${nextEvent.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
              >
                View event
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {/* Announcements list — spans 2 cols on lg */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-4">
              {announcements.length === 0 && (
                <div className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                  No announcements yet — check back soon.
                </div>
              )}
              {announcements.map((a) => (
                <Link
                  key={a.id}
                  href={`/news/${a.slug}`}
                  className="glass group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 transition hover:glow-primary sm:flex-row sm:items-center sm:gap-5 sm:p-6"
                >
                  {/* thumbnail */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                    <SmartImage
                      src={a.coverUrl ?? "/news/news-1.jpg"}
                      alt={a.title}
                      fill
                      wrapperClassName="absolute inset-0"
                      className="object-cover transition duration-500 group-hover:scale-110"
                      seed={a.id}
                      fallbackLabel="News"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em]">
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Megaphone className="h-3 w-3" />
                        {a.category}
                      </span>
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-muted-foreground">
                          <Pin className="h-2.5 w-2.5" />
                          Pinned
                        </span>
                      )}
                      {a.urgent && (
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
                          Urgent
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {fmtDate(a.publishAt)}
                      </span>
                    </div>
                    <h4 className="mt-1.5 font-display text-lg font-bold leading-tight transition group-hover:text-primary sm:text-xl">
                      {a.title}
                    </h4>
                    {a.excerpt && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {a.excerpt}
                      </p>
                    )}
                  </div>

                  <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Highlights;
