import { db } from "@/lib/db";
import { VideosManager } from "@/components/admin/videos-manager";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const rows = await db.video.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return <VideosManager initial={rows as any} />;
}
