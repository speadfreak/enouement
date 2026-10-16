import { db } from "@/lib/db";
import { AlbumsManager } from "@/components/admin/albums-manager";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const rows = await db.album.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { media: { orderBy: { order: "asc" } } },
  });
  return <AlbumsManager initial={rows as any} />;
}
