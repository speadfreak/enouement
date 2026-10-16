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
