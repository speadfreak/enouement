import { db } from "@/lib/db";

export const dbNavToLinks = (rows: { label: string; href: string; visible?: boolean }[]) =>
  rows.filter((r) => r.visible !== false).map((r) => ({ label: r.label, href: r.href }));

export async function getSite() {
  const s = await db.siteSetting.findUnique({ where: { id: "site" } });
  if (!s) return null;
  return {
    ...s,
    socialLinks: (s.socialLinks as Record<string, string>) ?? {},
    contactInfo: (s.contactInfo as Record<string, string>) ?? {},
  };
}

export async function getNavLinks() {
  const rows = await db.navLink.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
  return dbNavToLinks(rows);
}

export async function getHeroMedia() {
  return db.heroMedia.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });
}

export async function getStoryChapters() {
  return db.storyChapter.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
}

export async function getPosts(limit = 50, cursor?: string) {
  const items = await db.post.findMany({
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const nextCursor = items.length > limit ? items[items.length - 1].id : null;
  return { items: items.slice(0, limit), nextCursor };
}

export async function getAlbums() {
  return db.album.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { media: { orderBy: { order: "asc" } } },
  });
}

export async function getMerch() {
  return db.merchItem.findMany({ orderBy: { order: "asc" } });
}

export async function getAnnouncements(limit?: number) {
  return db.announcement.findMany({
    where: { published: true, publishAt: { lte: new Date() } },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    ...(limit ? { take: limit } : {}),
  });
}

export async function getAnnouncement(slug: string) {
  return db.announcement.findUnique({ where: { slug } });
}

export async function getEvents() {
  return db.event.findMany({
    where: { published: true },
    orderBy: { startDate: "asc" },
  });
}

export async function getEvent(slug: string) {
  return db.event.findUnique({ where: { slug } });
}

export async function getGraduation() {
  const g = await db.graduationContent.findUnique({ where: { id: "graduation" } });
  if (!g) return null;
  return { ...g, program: (g.program as any[]) ?? [] };
}

export async function getStudents() {
  return db.student.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
}

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

export async function getStudentsPaginated({
  page = 1,
  pageSize = 48,
  stream,
  section,
  club,
  query,
  sort,
}: PaginatedStudentsParams): Promise<PaginatedStudents> {
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
}

export type StudentStats = {
  total: number;
  natural: number;
  social: number;
  sections: string[];
  clubs: string[];
};

export async function getStudentStats(): Promise<StudentStats> {
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
}

export async function getVideos() {
  return db.video.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getStats() {
  const [students, events, posts, albums, videos] = await Promise.all([
    db.student.count(),
    db.event.count(),
    db.post.count(),
    db.album.count(),
    db.video.count(),
  ]);
  return { students, events, posts, albums, videos };
}
