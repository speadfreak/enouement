"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  Users,
  Leaf,
  Sparkles,
  LayoutGrid,
  Grid3x3,
  SlidersHorizontal,
  X,
  RotateCcw,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/smart-image";
import { AnimatedText } from "@/components/animated-text";
import { cn } from "@/lib/utils";
import type { StudentStats, StudentSort } from "@/lib/data";

/**
 * Public seniors explorer — designed for ~700 students across Natural /
 * Social streams.
 *
 * Server-passed `initial` (first 48, default filters) bootstraps the first
 * page of an `useInfiniteQuery` so the very first paint is instant; further
 * pages stream from `GET /api/students` as the user scrolls.
 */

type StreamFilter = "all" | "Natural" | "Social";

type Filters = {
  q: string;
  stream: StreamFilter;
  section: string | null;
  club: string | null;
  sort: StudentSort;
};

type Props = {
  initial: SeniorT[];
  initialTotal: number;
  stats: StudentStats;
};

// Items cross the RSC → client boundary as JSON, so Date becomes string.
export type SeniorT = {
  id: string;
  name: string;
  photoUrl: string | null;
  quote: string | null;
  futurePlan: string | null;
  nickname: string | null;
  section: string | null;
  club: string | null;
  stream: "Natural" | "Social" | null;
  featured: boolean;
  createdAt: string;
};

const PAGE_SIZE = 48;
const DEBOUNCE_MS = 250;

const DEFAULT_FILTERS: Filters = {
  q: "",
  stream: "all",
  section: null,
  club: null,
  sort: "featured",
};

const STREAM_PILLS = [
  { value: "all", label: "All" },
  { value: "Natural", label: "Natural" },
  { value: "Social", label: "Social" },
] as const;

type PageData = {
  items: SeniorT[];
  total: number;
  hasMore: boolean;
  nextPage: number | null;
};

async function fetchPage(page: number, filters: Filters): Promise<PageData> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  if (filters.stream !== "all") params.set("stream", filters.stream);
  if (filters.section) params.set("section", filters.section);
  if (filters.club) params.set("club", filters.club);
  const q = filters.q.trim();
  if (q) params.set("q", q);
  params.set("sort", filters.sort);
  const res = await fetch(`/api/students?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
  const data: Omit<PageData, "nextPage"> = await res.json();
  return { ...data, nextPage: data.hasMore ? page + 1 : null };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function firstLetter(name: string) {
  const m = name.trim().match(/^[\p{L}]/u);
  return m ? m[0].toUpperCase() : "#";
}

export function SeniorGrid({ initial, initialTotal, stats }: Props) {
  const reduceMotion = useReducedMotion();

  const [searchInput, setSearchInput] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = React.useState<"grid" | "wall">("grid");
  const [active, setActive] = React.useState<SeniorT | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Debounced search → filters.q
  React.useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === searchInput.trim() ? f : { ...f, q: searchInput.trim() }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isDefaultFilters = React.useMemo(
    () =>
      filters.q === "" &&
      filters.stream === "all" &&
      filters.section === null &&
      filters.club === null &&
      filters.sort === "featured",
    [filters],
  );

  const query = useInfiniteQuery({
    queryKey: ["seniors-public", filters],
    queryFn: ({ pageParam }) => fetchPage(pageParam, filters),
    initialPageParam: 1,
    initialData: isDefaultFilters
      ? {
          pages: [
            {
              items: initial,
              total: initialTotal,
              hasMore: initialTotal > initial.length,
              nextPage: initialTotal > initial.length ? 2 : null,
            },
          ] as PageData[],
          pageParams: [1] as number[],
        }
      : undefined,
    getNextPageParam: (last) => last.nextPage,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const items = React.useMemo<SeniorT[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const total = lastPage?.total ?? initialTotal;
  const hasMore = lastPage?.hasMore ?? false;
  const isFetching = query.isFetching;
  const isLoading = query.isLoading;

  const updateFilters = React.useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    setSheetOpen(false);
  }, []);

  const activeCount =
    (filters.stream !== "all" ? 1 : 0) +
    (filters.section ? 1 : 0) +
    (filters.club ? 1 : 0) +
    (filters.sort !== "featured" ? 1 : 0) +
    (filters.q ? 1 : 0);

  // Alphabet rail — letters present in the currently loaded items.
  const letters = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of items) set.add(firstLetter(s.name));
    return Array.from(set).sort();
  }, [items]);

  // Infinite scroll sentinel.
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !query.isFetching) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasMore, query.isFetching, query.fetchNextPage]);

  return (
    <section
      aria-label="Meet the batch"
      className="relative px-4 pb-24 pt-16 sm:px-6 md:pt-24 lg:px-8"
    >
      {/* Decorative aurora */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] overflow-hidden"
      >
        <div
          className="aurora"
          style={{ background: "#ffe600", width: 460, height: 460, top: -120, left: "-10%" }}
        />
        <div
          className="aurora"
          style={{ background: "#00c853", width: 520, height: 520, top: -80, right: "-12%" }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Meet the Batch
          </p>
          <AnimatedText
            as="h1"
            text="The Faces of 2K27"
            className="mt-4 font-display font-extrabold leading-[0.92] [font-size:clamp(2.5rem,8vw,6.5rem)]"
          />
          <p className="mx-auto mt-6 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
            Seven hundred stories. Two streams. One batch. Search the entire yearbook of the Class of 2K27 — filter by stream, section, or club, and meet every face that made our story.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-3 sm:gap-4">
          <StatPill icon={<Users className="size-4" />} value={stats.total} label="Total Seniors" tone="default" />
          <StatPill icon={<Sparkles className="size-4" />} value={stats.natural} label="Natural" tone="yellow" />
          <StatPill icon={<Leaf className="size-4" />} value={stats.social} label="Social" tone="green" />
        </div>

        {/* Sticky filter bar */}
        <div data-lenis-prevent className="sticky top-16 z-30 mt-12">
          <div className="glass-strong rounded-2xl border border-border p-3 sm:p-4">
            {/* Desktop / tablet: full bar */}
            <div className="hidden flex-wrap items-center gap-3 lg:flex">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
              />
              <StreamPills
                value={filters.stream}
                onChange={(stream) => updateFilters({ stream })}
                layoutId="stream-pill-d"
              />
              {stats.sections.length > 0 ? (
                <SectionSelect
                  sections={stats.sections}
                  value={filters.section}
                  onChange={(section) => updateFilters({ section })}
                />
              ) : null}
              {stats.clubs.length > 0 ? (
                <ClubSelect
                  clubs={stats.clubs}
                  value={filters.club}
                  onChange={(club) => updateFilters({ club })}
                />
              ) : null}
              <SortSelect value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
              <ViewToggle value={view} onChange={setView} />
              {activeCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-11 rounded-full text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
              ) : null}
            </div>

            {/* Mobile: search + filters button + stream pills + view toggle */}
            <div className="flex flex-col gap-3 lg:hidden">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
              />
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 shrink-0 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.15em]"
                    >
                      <SlidersHorizontal className="size-4" />
                      Filters
                      {activeCount > 0 ? (
                        <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
                          {activeCount}
                        </span>
                      ) : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="flex max-h-[88dvh] flex-col gap-4 rounded-t-3xl p-5 overscroll-contain"
                    data-lenis-prevent
                  >
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>Refine the batch.</SheetDescription>
                    </SheetHeader>
                    <div
                      className="no-scrollbar flex flex-col gap-3 overflow-y-auto pb-6"
                      data-lenis-prevent
                    >
                      <StreamPills
                        value={filters.stream}
                        onChange={(stream) => updateFilters({ stream })}
                        layoutId="stream-pill-sheet"
                      />
                      {stats.sections.length > 0 ? (
                        <SectionSelect
                          sections={stats.sections}
                          value={filters.section}
                          onChange={(section) => updateFilters({ section })}
                        />
                      ) : null}
                      {stats.clubs.length > 0 ? (
                        <ClubSelect
                          clubs={stats.clubs}
                          value={filters.club}
                          onChange={(club) => updateFilters({ club })}
                        />
                      ) : null}
                      <SortSelect
                        value={filters.sort}
                        onChange={(sort) => updateFilters({ sort })}
                      />
                      <ViewToggle value={view} onChange={setView} />
                      {activeCount > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetFilters}
                          className="h-11 rounded-full text-xs uppercase tracking-[0.15em]"
                        >
                          <RotateCcw className="size-3.5" />
                          Reset filters
                        </Button>
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>
                <StreamPills
                  value={filters.stream}
                  onChange={(stream) => updateFilters({ stream })}
                  layoutId="stream-pill-bar"
                />
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>
          </div>
        </div>

        {/* Result count + loading indicator */}
        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground">
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                <span className="font-display text-foreground">
                  {total.toLocaleString()}
                </span>{" "}
                {total === 1 ? "senior" : "seniors"}
                {filters.stream !== "all" ? ` in ${filters.stream}` : ""}
                {filters.q ? (
                  <>
                    {" "}
                    · matching{" "}
                    <span className="text-foreground">“{filters.q}”</span>
                  </>
                ) : null}
              </>
            )}
          </p>
          {isFetching && !isLoading ? (
            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading more
            </span>
          ) : null}
        </div>

        {/* Results */}
        <div className="relative mt-6">
          {isLoading ? (
            <SkeletonGrid view={view} />
          ) : items.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : view === "grid" ? (
            <motion.ul
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              <AnimatePresence mode="popLayout">
                {items.map((s, i) => (
                  <SeniorCard
                    key={s.id}
                    senior={s}
                    index={i}
                    reduceMotion={!!reduceMotion}
                    onClick={() => setActive(s)}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : (
            <WallView items={items} onSelect={setActive} />
          )}

          {/* Infinite-scroll sentinel */}
          {hasMore ? (
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
          ) : null}

          {/* Load-more fallback */}
          {hasMore && !isFetching ? (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => query.fetchNextPage()}
                className="h-11 rounded-full px-6"
              >
                Load more
                <ChevronDown className="size-4" />
              </Button>
            </div>
          ) : null}

          {/* End-of-list marker */}
          {!hasMore && items.length > 0 && !isLoading ? (
            <p className="mt-12 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
              — end of the batch —
            </p>
          ) : null}
        </div>
      </div>

      {/* Alphabet quick-jump rail (desktop only) */}
      {letters.length > 4 ? (
        <AlphabetRail letters={letters} />
      ) : null}

      {/* Profile dialog */}
      <ProfileDialog senior={active} onClose={() => setActive(null)} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                               */
/* -------------------------------------------------------------------------- */

function StatPill({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "default" | "yellow" | "green";
}) {
  const toneClass =
    tone === "yellow"
      ? "bg-primary text-primary-foreground"
      : tone === "green"
        ? "bg-secondary text-secondary-foreground"
        : "bg-foreground text-background";
  return (
    <div className="glass flex items-center gap-3 rounded-full px-4 py-2 sm:px-5 sm:py-2.5">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full sm:size-9",
          toneClass,
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="text-left">
        <p className="font-display text-xl font-black leading-none tabular-nums sm:text-2xl">
          {value.toLocaleString()}
        </p>
        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-full sm:min-w-[260px] sm:flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, nickname, club…"
        className="h-11 rounded-full pl-9 pr-9 text-sm"
        aria-label="Search seniors"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function StreamPills({
  value,
  onChange,
  layoutId,
}: {
  value: StreamFilter;
  onChange: (v: StreamFilter) => void;
  layoutId: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by stream"
      className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto rounded-full border border-border bg-surface/60 p-1"
    >
      {STREAM_PILLS.map((pill) => {
        const isActive = value === pill.value;
        const activeBg =
          pill.value === "Natural"
            ? "bg-primary"
            : pill.value === "Social"
              ? "bg-secondary"
              : "bg-foreground";
        const activeText =
          pill.value === "Natural"
            ? "text-primary-foreground"
            : pill.value === "Social"
              ? "text-secondary-foreground"
              : "text-background";
        return (
          <button
            key={pill.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(pill.value)}
            className={cn(
              "relative h-9 shrink-0 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
              isActive ? activeText : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className={cn("absolute inset-0 -z-10 rounded-full", activeBg)}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionSelect({
  sections,
  value,
  onChange,
}: {
  sections: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <Select
      value={value ?? "ALL"}
      onValueChange={(v) => onChange(v === "ALL" ? null : v)}
    >
      <SelectTrigger
        className="h-11 w-full rounded-full sm:w-[150px]"
        aria-label="Filter by section"
      >
        <SelectValue placeholder="Section" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All sections</SelectItem>
        {sections.map((s) => (
          <SelectItem key={s} value={s}>
            Section {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ClubSelect({
  clubs,
  value,
  onChange,
}: {
  clubs: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <Select
      value={value ?? "ALL"}
      onValueChange={(v) => onChange(v === "ALL" ? null : v)}
    >
      <SelectTrigger
        className="h-11 w-full rounded-full sm:w-[170px]"
        aria-label="Filter by club"
      >
        <SelectValue placeholder="Club" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="ALL">All clubs</SelectItem>
        {clubs.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: StudentSort;
  onChange: (v: StudentSort) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StudentSort)}>
      <SelectTrigger
        className="h-11 w-full rounded-full sm:w-[160px]"
        aria-label="Sort"
      >
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="featured">Featured first</SelectItem>
        <SelectItem value="name-asc">Name A → Z</SelectItem>
        <SelectItem value="name-desc">Name Z → A</SelectItem>
        <SelectItem value="newest">Newest</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "wall";
  onChange: (v: "grid" | "wall") => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 rounded-full border border-border bg-surface/60 p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors",
          value === "grid"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("wall")}
        aria-label="Wall view"
        aria-pressed={value === "wall"}
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors",
          value === "wall"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Grid3x3 className="size-4" />
      </button>
    </div>
  );
}

function SeniorCard({
  senior,
  index,
  reduceMotion,
  onClick,
}: {
  senior: SeniorT;
  index: number;
  reduceMotion: boolean;
  onClick: () => void;
}) {
  return (
    <motion.li
      layout={!reduceMotion}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{
        duration: reduceMotion ? 0 : 0.45,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      data-name-initial={firstLetter(senior.name)}
      className="cv-auto list-none"
      style={{ willChange: "transform" }}
    >
      <button
        type="button"
        onClick={onClick}
        className="group glass relative block w-full overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 hover:glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            fallbackLabel={initials(senior.name)}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          />
          {/* Gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Stream accent stripe */}
          {senior.stream ? (
            <span
              className={cn(
                "absolute left-2 top-2 h-8 w-1 rounded-full",
                senior.stream === "Natural" ? "bg-primary" : "bg-secondary",
              )}
              aria-hidden
            />
          ) : null}

          {/* Default front face */}
          <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
            <div className="transition-opacity duration-300 group-hover:opacity-0">
              <h3 className="font-display text-base font-extrabold leading-tight sm:text-lg">
                {senior.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {senior.section ? (
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-secondary">
                    § {senior.section}
                  </span>
                ) : null}
                {senior.stream ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.15em]",
                      senior.stream === "Natural"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {senior.stream === "Natural" ? "Nat" : "Soc"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Hover overlay (quote reveal) */}
          <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-4">
            <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
            <div className="relative">
              <h3 className="font-display text-base font-extrabold leading-tight sm:text-lg">
                {senior.name}
              </h3>
              {senior.nickname ? (
                <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.25em] text-primary">
                  “{senior.nickname}”
                </p>
              ) : null}
              {senior.quote ? (
                <p className="mt-2 line-clamp-3 text-xs text-foreground/80 sm:text-sm">
                  “{senior.quote}”
                </p>
              ) : senior.futurePlan ? (
                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-secondary">
                  {senior.futurePlan}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}

function WallView({
  items,
  onSelect,
}: {
  items: SeniorT[];
  onSelect: (s: SeniorT) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1.5 sm:gap-2">
      {items.map((s, i) => (
        <motion.button
          key={s.id}
          type="button"
          onClick={() => onSelect(s)}
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-5%" }}
          transition={{
            duration: 0.25,
            delay: Math.min((i % 48) * 0.01, 0.3),
            ease: [0.22, 1, 0.36, 1],
          }}
          data-name-initial={firstLetter(s.name)}
          title={s.name}
          aria-label={`View profile of ${s.name}`}
          className="group relative aspect-square overflow-hidden rounded-md border border-border/50 transition-transform hover:z-10 hover:scale-[1.18] hover:rounded-lg hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ willChange: "transform" }}
        >
          <SmartImage
            src={s.photoUrl ?? ""}
            alt={s.name}
            fill
            wrapperClassName="absolute inset-0"
            className="object-cover"
            seed={s.id}
            fallbackLabel={initials(s.name)}
            sizes="48px"
          />
          {/* Stream accent dot */}
          {s.stream ? (
            <span
              className={cn(
                "absolute right-0.5 top-0.5 size-1.5 rounded-full",
                s.stream === "Natural" ? "bg-primary" : "bg-secondary",
              )}
              aria-hidden
            />
          ) : null}
          {/* Hover name label */}
          <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 translate-y-full rounded bg-background/95 px-1 py-0.5 text-center text-[0.6rem] font-medium text-foreground opacity-0 transition-opacity group-hover:translate-y-0 group-hover:opacity-100">
            {s.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function SkeletonGrid({ view }: { view: "grid" | "wall" }) {
  if (view === "wall") {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1.5 sm:gap-2">
        {Array.from({ length: 96 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border">
          <Skeleton className="aspect-[3/4] w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-border bg-surface/60">
        <Search className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <p className="font-display text-2xl font-bold">No students found.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different name, section, or stream.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        className="h-11 rounded-full px-6"
      >
        <RotateCcw className="size-4" />
        Reset filters
      </Button>
    </div>
  );
}

function AlphabetRail({ letters }: { letters: string[] }) {
  const handleClick = (letter: string) => {
    const target = document.querySelector(
      `[data-name-initial="${CSS.escape(letter)}"]`,
    );
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  return (
    <nav
      aria-label="Alphabetical quick jump"
      className="fixed right-2 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-0.5 xl:flex"
    >
      {letters.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleClick(l)}
          className="flex size-6 items-center justify-center rounded-md font-mono text-[0.65rem] font-bold text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {l}
        </button>
      ))}
    </nav>
  );
}

function ProfileDialog({
  senior,
  onClose,
}: {
  senior: SeniorT | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!senior} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl border-border p-0 sm:max-w-3xl overscroll-contain"
        data-lenis-prevent
      >
        {senior ? (
          <>
            <DialogTitle className="sr-only">{senior.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Profile of {senior.name}
              {senior.section ? `, section ${senior.section}` : ""}
              {senior.stream ? `, ${senior.stream} stream` : ""}
              {senior.club ? `, ${senior.club}` : ""}.
            </DialogDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {/* Photo */}
              <div className="relative aspect-[3/4] overflow-hidden sm:aspect-auto">
                <SmartImage
                  src={senior.photoUrl ?? ""}
                  alt={senior.name}
                  fill
                  wrapperClassName="absolute inset-0"
                  className="object-cover"
                  seed={senior.id}
                  fallbackLabel={initials(senior.name)}
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent sm:bg-gradient-to-r" />
                {senior.featured ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                    <Sparkles className="size-3" />
                    Featured
                  </span>
                ) : null}
              </div>

              {/* Details */}
              <div
                className="no-scrollbar flex max-h-[80dvh] flex-col gap-5 overflow-y-auto p-6 sm:max-h-[90dvh] sm:p-8"
                data-lenis-prevent
              >
                <div>
                  {senior.nickname ? (
                    <p className="text-xs uppercase tracking-[0.25em] text-secondary">
                      “{senior.nickname}”
                    </p>
                  ) : null}
                  <h3 className="mt-1 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                    {senior.name}
                  </h3>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {senior.stream ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em]",
                        senior.stream === "Natural"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {senior.stream === "Natural" ? (
                        <Sparkles className="size-3" />
                      ) : (
                        <Leaf className="size-3" />
                      )}
                      {senior.stream} stream
                    </span>
                  ) : null}
                  {senior.section ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                      Section {senior.section}
                    </span>
                  ) : null}
                  {senior.club ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-semibold text-foreground">
                      {senior.club}
                    </span>
                  ) : null}
                </div>

                {senior.quote ? (
                  <blockquote className="border-l-2 border-primary pl-4 text-lg italic leading-relaxed text-foreground/90 sm:text-xl">
                    “{senior.quote}”
                  </blockquote>
                ) : null}

                {senior.futurePlan ? (
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                      Next stop
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {senior.futurePlan}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
