"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";

type Announcement = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  category: string;
  pinned: boolean;
  urgent: boolean;
  publishAt: Date | string;
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function AnnCard({ a, i }: { a: Announcement; i: number }) {
  const reduce = useReducedMotion();
  const d = new Date(a.publishAt);
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3) }}
    >
      <Link
        href={`/announcements/${a.slug}`}
        className="group glass flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:glow-primary"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <SmartImage
            src={a.coverUrl ?? "/announcements/placeholder.jpg"}
            alt={a.title}
            fill
            seed={a.slug}
            fallbackLabel={a.title}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge variant="secondary">{a.category}</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">
            {a.title}
          </h3>
          {a.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {a.excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5 text-primary" />
              {MONTHS_SHORT[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
            </span>
            <ArrowUpRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function AnnouncementsGrid({
  items,
  categories,
}: {
  items: Announcement[];
  categories: string[];
}) {
  const [active, setActive] = React.useState<string>("all");

  const filtered =
    active === "all" ? items : items.filter((a) => a.category === active);

  return (
    <div>
      {/* Filter chips */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive("all")}
            aria-pressed={active === "all"}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
              active === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              aria-pressed={active === c}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          No stories in this category yet.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => (
            <AnnCard key={a.id} a={a} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
