import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://enouement2k27.et";

  const staticRoutes = [
    "",
    "/story",
    "/moments",
    "/gallery",
    "/seniors",
    "/events",
    "/announcements",
    "/graduation",
    "/merch",
    "/videos",
    "/contact",
  ].map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.8,
  }));

  const [events, announcements] = await Promise.all([
    db.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.announcement.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const eventRoutes = events.map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const announcementRoutes = announcements.map((a) => ({
    url: `${base}/announcements/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...eventRoutes, ...announcementRoutes];
}
