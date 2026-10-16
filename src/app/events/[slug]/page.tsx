import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";
import { getEvent, getEvents } from "@/lib/data";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getEvent(slug);
  if (!ev) return { title: "Event not found" };
  return {
    title: ev.title,
    description: ev.description ?? ev.title,
  };
}

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function fmtTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ampm}`;
}
function fmtFullDate(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const CATEGORY_LABEL: Record<string, string> = {
  senior: "Senior",
  farewell: "Farewell",
  graduation: "Graduation",
  special: "Special",
};

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Suggestions: upcoming other events
  const all = await getEvents();
  const others = all.filter((e) => e.slug !== event.slug).slice(0, 3);

  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  return (
    <PageShell>
      <article className="relative pb-24">
        {/* Hero */}
        <header className="relative overflow-hidden pt-28 pb-10 md:pt-36">
          <div
            aria-hidden
            className="aurora -top-24 left-1/3 h-80 w-80 bg-primary/30"
          />
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back to events
            </Link>

            <div className="mt-6 flex items-center gap-3">
              <Badge variant="secondary">
                {CATEGORY_LABEL[event.category] ?? event.category}
              </Badge>
              <span className="text-xs uppercase tracking-[0.3em] text-primary">
                Event
              </span>
            </div>

            <AnimatedText
              as="h1"
              text={event.title}
              className="mt-3 font-display font-extrabold text-4xl sm:text-6xl leading-[0.95] tracking-tight"
            />

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarIcon className="size-4 text-primary" />
                {fmtFullDate(start)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                {fmtTime(start)}
                {end ? ` — ${fmtTime(end)}` : ""}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Cover */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl gradient-border">
            <SmartImage
              src={event.coverUrl ?? "/events/placeholder.jpg"}
              alt={event.title}
              fill
              seed={event.slug}
              fallbackLabel={event.title}
              className="object-cover"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent"
            />
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto mt-12 max-w-3xl px-4 sm:px-6 lg:px-8">
          {event.description && (
            <p className="font-display text-xl leading-relaxed text-foreground/90 sm:text-2xl">
              {event.description}
            </p>
          )}

          {event.body && (
            <div className="mt-8 leading-relaxed text-muted-foreground [&>h1]:font-display [&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:text-foreground [&>h1]:mt-8 [&>h1]:mb-3 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:font-display [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-5 [&>h3]:mb-2 [&>p]:my-4 [&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-foreground/80 [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-4 [&>code]:rounded [&>code]:bg-surface [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:text-sm [&>strong]:text-foreground [&>strong]:font-semibold">
              <ReactMarkdown>{event.body}</ReactMarkdown>
            </div>
          )}

          {!event.body && event.description && (
            <p className="mt-6 text-muted-foreground">
              More details coming soon.
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Tag className="size-3.5 text-primary" />
              {CATEGORY_LABEL[event.category] ?? event.category}
            </Badge>
            {event.location && (
              <Badge variant="outline" className="gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                {event.location}
              </Badge>
            )}
          </div>
        </div>

        {/* Other events */}
        {others.length > 0 && (
          <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              <span className="text-gradient">More</span> on the calendar
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.slug}`}
                  className="group glass flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:glow-primary"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SmartImage
                      src={e.coverUrl ?? "/events/placeholder.jpg"}
                      alt={e.title}
                      fill
                      seed={e.slug}
                      fallbackLabel={e.title}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {CATEGORY_LABEL[e.category] ?? e.category}
                    </Badge>
                    <h3 className="font-display text-lg font-bold leading-tight">
                      {e.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fmtFullDate(new Date(e.startDate))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </PageShell>
  );
}
