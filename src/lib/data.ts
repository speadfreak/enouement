import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

// ============================================================================
// Caching strategy
// ----------------------------------------------------------------------------
// Every public read helper below is wrapped with `unstable_cache` so the
// data layer is the single source of truth for the cache key + tags + TTL.
// Tag names are stable strings so admin mutations can call `revalidateTag`
// without coupling to internal key formats.
//
// Tag → revalidate (seconds) → used by
//   "site"           300  layout.tsx, page-shell, contact, footer
//   "nav"            300  page-shell, navbar
//   "hero"            60  home hero
//   "story"          300  /story
//   "posts"           30  /moments (RSC seed) + /api/posts
//   "albums"          60  /gallery
//   "announcements"   60  /announcements
//   "events"          60  /events
//   "graduation"     300  /graduation
//   "students"        60  /seniors (RSC seed) + /api/students
//   "videos"          60  /videos
//   "stats"           60  home stats counter
//   "dev-links"      300  page-shell → footer
// ============================================================================

export const dbNavToLinks = (rows: { label: string; href: string; visible?: boolean }[]) =>
  rows.filter((r) => r.visible !== false).map((r) => ({ label: r.label, href: r.href }));

// ---------------------------------------------------------------------------
// Site / nav / hero
// ---------------------------------------------------------------------------

export const getSite = unstable_cache(
  async () => {
    const s = await db.siteSetting.findUnique({ where: { id: "site" } });
    if (!s) return null;
    return {
      ...s,
      socialLinks: (s.socialLinks as Record<string, string>) ?? {},
      contactInfo: (s.contactInfo as Record<string, string>) ?? {},
    };
  },
  ["data:site"],
  { tags: ["site"], revalidate: 300 }
);

export const getNavLinks = unstable_cache(
  async () => {
    const rows = await db.navLink.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    });
    return dbNavToLinks(rows);
  },
  ["data:nav"],
  { tags: ["nav"], revalidate: 300 }
);

export const getHeroMedia = unstable_cache(
  async () => {
    return db.heroMedia.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    });
  },
  ["data:hero"],
  { tags: ["hero"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

export const getStoryChapters = unstable_cache(
  async () => {
    return db.storyChapter.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
  },
  ["data:story"],
  { tags: ["story"], revalidate: 300 }
);

// ---------------------------------------------------------------------------
// Moments / posts
// ---------------------------------------------------------------------------

/**
 * Public moments feed seed. Returns the first `limit` posts + a cursor for
 * "load more". Only the fields the UI actually renders are selected so we
 * keep the DB payload small.
 */
export const getPosts = unstable_cache(
  async (limit = 50, cursor?: string) => {
    const items = await db.post.findMany({
      where: { published: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        caption: true,
        tags: true,
        mediaUrls: true,
        mediaType: true,
        pinned: true,
        published: true,
        authorName: true,
        likeCount: true,
        createdAt: true,
      },
    });
    const nextCursor = items.length > limit ? items[items.length - 1].id : null;
    return { items: items.slice(0, limit), nextCursor };
  },
  ["data:posts"],
  { tags: ["posts"], revalidate: 30 }
);

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const getAlbums = unstable_cache(
  async () => {
    return db.album.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: { media: { orderBy: { order: "asc" } } },
    });
  },
  ["data:albums"],
  { tags: ["albums"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Merch
// ---------------------------------------------------------------------------

export const getMerch = unstable_cache(
  async () => {
    return db.merchItem.findMany({ orderBy: { order: "asc" } });
  },
  ["data:merch"],
  { tags: ["merch"], revalidate: 300 }
);

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export const getAnnouncements = unstable_cache(
  async (limit?: number) => {
    return db.announcement.findMany({
      where: { published: true, publishAt: { lte: new Date() } },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      ...(limit ? { take: limit } : {}),
    });
  },
  ["data:announcements"],
  { tags: ["announcements"], revalidate: 60 }
);

export async function getAnnouncement(slug: string) {
  return db.announcement.findUnique({ where: { slug } });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const getEvents = unstable_cache(
  async () => {
    return db.event.findMany({
      where: { published: true },
      orderBy: { startDate: "asc" },
    });
  },
  ["data:events"],
  { tags: ["events"], revalidate: 60 }
);

export async function getEvent(slug: string) {
  return db.event.findUnique({ where: { slug } });
}

// ---------------------------------------------------------------------------
// Graduation
// ---------------------------------------------------------------------------

export const getGraduation = unstable_cache(
  async () => {
    const g = await db.graduationContent.findUnique({ where: { id: "graduation" } });
    if (!g) return null;
    return { ...g, program: (g.program as any[]) ?? [] };
  },
  ["data:graduation"],
  { tags: ["graduation"], revalidate: 300 }
);

// ---------------------------------------------------------------------------
// Students / seniors explorer
// ---------------------------------------------------------------------------

/**
 * Featured/full list (used by the home page highlights). This caches as a
 * single blob keyed on no args. The paginated variant below is intentionally
 * NOT cached because every filter/page combo would balloon the cache.
 */
export const getStudents = unstable_cache(
  async () => {
    return db.student.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      select: {
        id: true,
        name: true,
        photoUrl: true,
        nickname: true,
        section: true,
        stream: true,
        club: true,
        quote: true,
        futurePlan: true,
        featured: true,
        order: true,
      },
    });
  },
  ["data:students"],
  { tags: ["students"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Public seniors explorer — paginated + filterable + sortable
// Designed for ~700 students across Natural / Social streams.
// ---------------------------------------------------------------------------

export type StudentStream = "Natural" | "Social" | null;
export type StudentSort = "featured" | "name-asc" | "name-desc" | "newest";

export type PaginatedStudentsParams = {
  page?: number;
  pageSize?: number;
  stream?: StudentStream;
  section?: string | null;
  club?: string | null;
  query?: string | null;
  sort?: StudentSort;
};

export type SeniorListItem = {
  id: string;
  name: string;
  photoUrl: string | null;
  quote: string | null;
  futurePlan: string | null;
  nickname: string | null;
  section: string | null;
  club: string | null;
  stream: StudentStream;
  featured: boolean;
  // ISO string — items always cross the RSC / fetch JSON boundary as strings.
  createdAt: string;
};

export type PaginatedStudents = {
  items: SeniorListItem[];
  total: number;
  hasMore: boolean;
};

function buildStudentOrderBy(sort?: StudentSort) {
  switch (sort) {
    case "name-asc":
      return [{ name: "asc" as const }];
    case "name-desc":
      return [{ name: "desc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }];
    case "featured":
    default:
      return [{ featured: "desc" as const }, { order: "asc" as const }];
  }
}

/**
 * Paginated + filtered seniors list. Cached with a composite key derived
 * from every argument so each unique query gets its own cache entry but
 * still invalidates with the `students` tag on any admin mutation.
 */
export const getStudentsPaginated = unstable_cache(
  async ({
    page = 1,
    pageSize = 48,
    stream,
    section,
    club,
    query,
    sort,
  }: PaginatedStudentsParams): Promise<PaginatedStudents> => {
    const take = Math.max(1, Math.min(pageSize, 100));
    const p = Math.max(1, Math.floor(page));
    const skip = (p - 1) * take;

    const q = query?.trim();
    const where = {
      published: true,
      ...(stream ? { stream } : {}),
      ...(section ? { section } : {}),
      ...(club ? { club } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { nickname: { contains: q, mode: "insensitive" as const } },
              { club: { contains: q, mode: "insensitive" as const } },
              { futurePlan: { contains: q, mode: "insensitive" as const } },
              { section: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: buildStudentOrderBy(sort),
        skip,
        take: take + 1, // peek one extra to compute hasMore cheaply
        select: {
          id: true,
          name: true,
          photoUrl: true,
          nickname: true,
          section: true,
          stream: true,
          club: true,
          quote: true,
          futurePlan: true,
          featured: true,
          order: true,
          createdAt: true,
        },
      }),
      db.student.count({ where }),
    ]);

    const hasMore = items.length > take;
    const trimmed = hasMore ? items.slice(0, take) : items;

    return {
      items: trimmed.map((s) => ({
        id: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        quote: s.quote,
        futurePlan: s.futurePlan,
        nickname: s.nickname,
        section: s.section,
        club: s.club,
        stream: (s.stream as StudentStream) ?? null,
        featured: s.featured,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      hasMore,
    };
  },
  ["data:students-paginated"],
  { tags: ["students"], revalidate: 60 }
);

export type StudentStats = {
  total: number;
  natural: number;
  social: number;
  sections: string[];
  clubs: string[];
};

export const getStudentStats = unstable_cache(
  async (): Promise<StudentStats> => {
    const where = { published: true };
    const [total, natural, social, sectionsRows, clubsRows] = await Promise.all([
      db.student.count({ where }),
      db.student.count({ where: { ...where, stream: "Natural" } }),
      db.student.count({ where: { ...where, stream: "Social" } }),
      db.student.findMany({
        where: { ...where, section: { not: null } },
        distinct: ["section"],
        select: { section: true },
      }),
      db.student.findMany({
        where: { ...where, club: { not: null } },
        distinct: ["club"],
        select: { club: true },
      }),
    ]);

    const sections = sectionsRows
      .map((r) => r.section)
      .filter((s): s is string => Boolean(s))
      .sort((a, b) => a.localeCompare(b));
    const clubs = clubsRows
      .map((r) => r.club)
      .filter((c): c is string => Boolean(c))
      .sort((a, b) => a.localeCompare(b));

    return { total, natural, social, sections, clubs };
  },
  ["data:student-stats"],
  { tags: ["students"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export const getVideos = unstable_cache(
  async () => {
    return db.video.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  },
  ["data:videos"],
  { tags: ["videos"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Stats (home counter)
// ---------------------------------------------------------------------------

export const getStats = unstable_cache(
  async () => {
    const [students, events, posts, albums, videos] = await Promise.all([
      db.student.count(),
      db.event.count(),
      db.post.count(),
      db.album.count(),
      db.video.count(),
    ]);
    return { students, events, posts, albums, videos };
  },
  ["data:stats"],
  { tags: ["stats"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Developer links (footer)
// ---------------------------------------------------------------------------

export const getDeveloperLinks = unstable_cache(
  async () => {
    return db.developerLink.findMany({
      where: { enabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  },
  ["data:dev-links"],
  { tags: ["dev-links"], revalidate: 300 }
);

// ---------------------------------------------------------------------------
// Footer link groups (admin-managed Explore / Experience / Batch columns)
// ---------------------------------------------------------------------------

export const getFooterLinkGroups = unstable_cache(
  async () => {
    return db.footerLinkGroup.findMany({
      where: { visible: true },
      include: {
        links: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });
  },
  ["data:footer-links"],
  { tags: ["footer-links"], revalidate: 300 }
);

// ---------------------------------------------------------------------------
// Memory wall (approved messages)
// ---------------------------------------------------------------------------

export const getApprovedMemoryMessages = unstable_cache(
  async (limit = 20) => {
    const take = Math.max(1, Math.min(limit, 100));
    return db.memoryWallMessage.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  ["data:memory-wall"],
  { tags: ["memory-wall"], revalidate: 30 }
);

// ---------------------------------------------------------------------------
// Visit counter
// ----------------------------------------------------------------------------

export const getVisitCount = unstable_cache(
  async () => {
    const row = await db.visitCounter.findUnique({ where: { id: "visits" } });
    if (!row) {
      return {
        id: "visits",
        count: 0,
        month: new Date().toISOString().slice(0, 7),
        updatedAt: new Date(0),
      };
    }
    return row;
  },
  ["data:visits"],
  { tags: ["visits"], revalidate: 60 }
);

/**
 * Increment the visit counter. NOT cached — intended to be called once per
 * page load (server-side via PageShell's `after()` hook) or via an API route.
 * Best-effort: swallows errors so analytics never breaks a render.
 */
export async function incrementVisitCount(): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  try {
    await db.visitCounter.upsert({
      where: { id: "visits" },
      update: { count: { increment: 1 }, month },
      create: { id: "visits", count: 1, month },
    });
  } catch {
    /* analytics best-effort — never throw on a counter failure */
  }
}
