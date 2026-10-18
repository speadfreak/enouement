import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { EventList } from "@/components/events/event-list";
import { getEvents } from "@/lib/data";

// ISR: regenerate at most every 60s. Cached reads (tag "events", revalidate 60).
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events",
  description:
    "The calendar of Enouement 2K27 — every senior event, farewell, and the final walk.",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div
          aria-hidden
          className="aurora -top-32 -left-32 h-80 w-80 bg-primary/30"
        />
        <div
          aria-hidden
          className="aurora -top-20 right-0 h-72 w-72 bg-secondary/30"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Events
          </p>
          <AnimatedText
            as="h1"
            text="The Calendar of 2K27"
            className="mt-4 font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight"
          />
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            From the first sunrise to the final walk — every gathering that
            writes our story. Tap a day, tap a card, and step into the moment.
          </p>
        </div>
      </section>

      <Marquee text="Save the Dates" className="text-primary" />

      {/* LIST */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <EventList events={events} />
        </div>
      </section>
    </PageShell>
  );
}
