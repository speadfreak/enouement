"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";

type EventItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  body: string | null;
  coverUrl: string | null;
  location: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  category: string;
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_LABEL: Record<string, string> = {
  senior: "Senior",
  farewell: "Farewell",
  graduation: "Graduation",
  special: "Special",
};

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

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

/* ----------------------------- Countdown ----------------------------- */
function useCountdown(target: Date) {
  const [now, setNow] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

function Countdown({ target }: { target: Date }) {
  const { days, hours, mins, secs } = useCountdown(target);
  const units: [string, number][] = [
    ["Days", days],
    ["Hrs", hours],
    ["Min", mins],
    ["Sec", secs],
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {units.map(([label, value]) => (
        <div
          key={label}
          className="gradient-border min-w-[78px] flex-1 px-4 py-3 text-center"
        >
          <div className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
            {pad(value)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Date badge ----------------------------- */
function DateBadge({ date, large }: { date: Date; large?: boolean }) {
  return (
    <div
      className={`gradient-border flex flex-col items-center justify-center ${
        large ? "h-24 w-24" : "h-16 w-16"
      } shrink-0`}
    >
      <div
        className={`font-display font-extrabold leading-none text-foreground ${
          large ? "text-4xl" : "text-2xl"
        }`}
      >
        {date.getDate()}
      </div>
      <div
        className={`uppercase tracking-[0.2em] text-primary ${
          large ? "text-xs mt-1" : "text-[10px]"
        }`}
      >
        {MONTHS_SHORT[date.getMonth()]}
      </div>
    </div>
  );
}

/* ----------------------------- Event card ----------------------------- */
function EventCard({ event, index }: { event: EventItem; index: number }) {
  const reduce = useReducedMotion();
  const d = toDate(event.startDate);
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        href={`/events/${event.slug}`}
        className="group glass relative flex flex-col gap-5 overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:glow-primary sm:flex-row sm:p-5"
      >
        {/* Cover */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl sm:w-48 sm:shrink-0">
          <SmartImage
            src={event.coverUrl ?? "/events/placeholder.jpg"}
            alt={event.title}
            fill
            seed={event.slug}
            fallbackLabel={event.title}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-3">
            <DateBadge date={d} />
            <div className="min-w-0 flex-1">
              <Badge variant="secondary" className="mb-2">
                {CATEGORY_LABEL[event.category] ?? event.category}
              </Badge>
              <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight">
                {event.title}
              </h3>
            </div>
          </div>

          {event.description && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-primary" />
              {fmtFullDate(d)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              {fmtTime(d)}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                {event.location}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            View details
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* --------------------- Next-up highlighted card --------------------- */
function NextUpCard({ event }: { event: EventItem }) {
  const reduce = useReducedMotion();
  const d = toDate(event.startDate);
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl gradient-border glow-primary"
    >
      <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-2 md:gap-8 md:p-10">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground">
              Next Up
            </Badge>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              {CATEGORY_LABEL[event.category] ?? event.category}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <DateBadge date={d} large />
            <div>
              <h3 className="font-display text-3xl sm:text-5xl font-extrabold leading-[0.95] tracking-tight">
                <span className="text-gradient">{event.title}</span>
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="size-4 text-primary" />
                  {fmtFullDate(d)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  {fmtTime(d)}
                </span>
              </div>
              {event.location && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-primary" />
                  {event.location}
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <p className="max-w-md leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          )}

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
              Counting down
            </p>
            <Countdown target={d} />
          </div>

          <Link
            href={`/events/${event.slug}`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <span className="underline-offset-4 group-hover:underline">
              See event details
            </span>
            <ArrowUpRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Right — cover */}
        <div className="relative min-h-[260px] overflow-hidden rounded-2xl md:min-h-full">
          <SmartImage
            src={event.coverUrl ?? "/events/placeholder.jpg"}
            alt={event.title}
            fill
            seed={event.slug}
            fallbackLabel={event.title}
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------- Timeline ----------------------------- */
function Timeline({ events }: { events: EventItem[] }) {
  const now = new Date();
  const upcoming = events
    .filter((e) => toDate(e.startDate) >= now)
    .sort((a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime());
  const past = events
    .filter((e) => toDate(e.startDate) < now)
    .sort((a, b) => toDate(b.startDate).getTime() - toDate(a.startDate).getTime());

  const nextUp = upcoming[0];
  const restUpcoming = nextUp ? upcoming.slice(1) : [];

  if (events.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
        No events scheduled yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {nextUp && <NextUpCard event={nextUp} />}

      {restUpcoming.length > 0 && (
        <section>
          <h3 className="mb-5 font-display text-2xl font-bold">
            <span className="text-gradient">Upcoming</span>
          </h3>
          <div className="flex flex-col gap-4">
            {restUpcoming.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="mb-5 font-display text-2xl font-bold text-muted-foreground">
            Past events
          </h3>
          <div className="flex flex-col gap-4 opacity-80">
            {past.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ----------------------------- Calendar ----------------------------- */
function CalendarView({ events }: { events: EventItem[] }) {
  const reduce = useReducedMotion();
  const now = new Date();
  const [cursor, setCursor] = React.useState<Date>(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Map yyyy-mm-dd -> events[]
  const byDay = React.useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const d = toDate(e.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();
  const todayDay = isCurrentMonth ? now.getDate() : null;

  const selectedKey = selectedDay
    ? `${year}-${month}-${selectedDay}`
    : null;
  const selectedEvents = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setSelectedDay(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              {year}
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">
              {MONTHS_LONG[month]}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="glass-strong flex size-11 items-center justify-center rounded-lg text-foreground transition hover:text-primary"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="glass-strong flex size-11 items-center justify-center rounded-lg text-foreground transition hover:text-primary"
            >
              ›
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs"
            >
              {w.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} aria-hidden />;
            const key = `${year}-${month}-${day}`;
            const dayEvents = byDay.get(key) ?? [];
            const isToday = todayDay === day;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                aria-pressed={isSelected}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : isToday
                    ? "border-primary/50 bg-secondary/10 text-foreground"
                    : "border-border bg-surface/40 text-foreground/80 hover:border-primary/50"
                }`}
              >
                <span
                  className={`font-medium ${
                    isToday ? "text-primary" : ""
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <span
                        key={idx}
                        className="size-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            Event day
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-primary/60" />
            Today
          </span>
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass rounded-2xl p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              {MONTHS_LONG[month]} {selectedDay}, {year}
            </p>
            <h4 className="mt-1 font-display text-xl font-bold">
              {selectedEvents.length > 0
                ? `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""} on this day`
                : "No events on this day"}
            </h4>
            {selectedEvents.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {selectedEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3 transition hover:border-primary/50 hover:bg-surface/80"
                  >
                    <DateBadge date={toDate(e.startDate)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold leading-tight">
                        {e.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtTime(toDate(e.startDate))}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ----------------------------- Root ----------------------------- */
export function EventList({ events }: { events: EventItem[] }) {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            <span className="text-gradient">Browse</span> the schedule
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch between a story timeline and a month grid.
          </p>
        </div>
        <TabsList className="h-11">
          <TabsTrigger value="timeline" className="min-h-[40px] px-4">Timeline</TabsTrigger>
          <TabsTrigger value="calendar" className="min-h-[40px] px-4">Calendar</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="timeline">
        <Timeline events={events} />
      </TabsContent>
      <TabsContent value="calendar">
        <CalendarView events={events} />
      </TabsContent>
    </Tabs>
  );
}
