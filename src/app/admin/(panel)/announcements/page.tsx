import { db } from "@/lib/db";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const rows = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    take: 200,
  });
  return <AnnouncementsManager initial={rows as any} />;
}
