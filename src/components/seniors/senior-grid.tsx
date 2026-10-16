"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SmartImage } from "@/components/smart-image";
import { AnimatedText } from "@/components/animated-text";

export type SeniorT = {
  id: string;
  name: string;
  photoUrl: string | null;
  quote: string | null;
  futurePlan: string | null;
  nickname: string | null;
  section: string | null;
  club: string | null;
};

type Props = {
  seniors: SeniorT[];
};

export function SeniorGrid({ seniors }: Props) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>("ALL");
  const [active, setActive] = useState<SeniorT | null>(null);

  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const s of seniors) if (s.section) set.add(s.section);
    return ["ALL", ...Array.from(set).sort()];
  }, [seniors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return seniors.filter((s) => {
      if (section !== "ALL" && s.section !== section) return false;
      if (!q) return true;
      const hay = [
        s.name,
        s.nickname ?? "",
        s.futurePlan ?? "",
        s.club ?? "",
        s.section ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [seniors, query, section]);

  return (
    <section
      aria-label="Meet the batch"
      className="px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Meet the Batch
          </p>
          <AnimatedText
            as="h1"
            text="The Faces of 2K27"
            className="mt-4 font-display text-5xl font-extrabold leading-[0.92] sm:text-7xl lg:text-8xl"
          />
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-6">
          <div className="glass flex items-center gap-3 rounded-full px-5 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Users className="size-4" aria-hidden />
            </span>
            <div className="text-left">
              <p className="font-display text-2xl font-black leading-none">
                {seniors.length}
              </p>
              <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                Total Seniors
              </p>
            </div>
          </div>
          {sections.length > 2 ? (
            <div className="glass flex items-center gap-3 rounded-full px-5 py-2.5">
              <div className="text-left">
                <p className="font-display text-2xl font-black leading-none">
                  {sections.length - 1}
                </p>
                <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                  Sections
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, plan, club…"
              className="h-11 rounded-full pl-9 text-sm"
              aria-label="Search seniors"
            />
          </div>

          {/* Section filter */}
          {sections.length > 1 ? (
            <div
              role="tablist"
              aria-label="Filter by section"
              className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0"
            >
              {sections.map((s) => {
                const active = section === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSection(s)}
                    className={`relative h-9 shrink-0 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="section-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : null}
                    {s === "ALL" ? "All" : s}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Grid */}
        <div className="mt-10">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl font-bold">No one matches.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different name or section.
              </p>
            </div>
          ) : (
            <motion.ul
              layout
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((s, i) => (
                  <SeniorCard
                    key={s.id}
                    senior={s}
                    index={i}
                    onClick={() => setActive(s)}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl overflow-hidden border-border p-0">
          <DialogTitle className="sr-only">{active?.name}</DialogTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative aspect-[3/4] sm:aspect-auto">
              {active ? (
                <SmartImage
                  src={active.photoUrl ?? ""}
                  alt={active.name}
                  fill
                  wrapperClassName="absolute inset-0"
                  className="object-cover"
                  seed={active.id}
                  fallbackLabel={active.name}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <div>
                {active?.nickname ? (
                  <p className="text-xs uppercase tracking-[0.25em] text-secondary">
                    “{active.nickname}”
                  </p>
                ) : null}
                <h3 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
                  {active?.name}
                </h3>
              </div>

              {active?.quote ? (
                <blockquote className="border-l-2 border-primary pl-4 text-base text-foreground/90 sm:text-lg">
                  “{active.quote}”
                </blockquote>
              ) : null}

              <div className="space-y-3 text-sm sm:text-base">
                {active?.futurePlan ? (
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                      Next Stop
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {active.futurePlan}
                    </p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-4">
                  {active?.section ? (
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                        Section
                      </p>
                      <p className="mt-0.5 font-display font-bold text-primary">
                        {active.section}
                      </p>
                    </div>
                  ) : null}
                  {active?.club ? (
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                        Club
                      </p>
                      <p className="mt-0.5 font-medium text-foreground">
                        {active.club}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SeniorCard({
  senior,
  index,
  onClick,
}: {
  senior: SeniorT;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="list-none"
    >
      <button
        type="button"
        onClick={onClick}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border text-left transition-all duration-300 hover:-translate-y-1 hover:glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`View profile of ${senior.name}`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <SmartImage
            src={senior.photoUrl ?? ""}
            alt={senior.name}
            fill
            wrapperClassName="absolute inset-0"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            seed={senior.id}
            fallbackLabel={senior.name}
          />
          {/* Gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          {/* Hover overlay with details */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
            {/* Default (front) */}
            <div className="transition-opacity duration-300 group-hover:opacity-0">
              <h3 className="font-display text-lg font-extrabold leading-tight sm:text-xl">
                {senior.name}
              </h3>
              {senior.section ? (
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-secondary">
                  Section {senior.section}
                </p>
              ) : null}
            </div>
            {/* Hover (back) */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-5">
              <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
              <div className="relative">
                <h3 className="font-display text-lg font-extrabold leading-tight sm:text-xl">
                  {senior.name}
                </h3>
                {senior.nickname ? (
                  <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.25em] text-primary">
                    “{senior.nickname}”
                  </p>
                ) : null}
                {senior.quote ? (
                  <p className="mt-2 line-clamp-3 text-xs text-foreground/80 sm:text-sm">
                    “{senior.quote}”
                  </p>
                ) : null}
                {senior.futurePlan ? (
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-secondary">
                    {senior.futurePlan}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}
