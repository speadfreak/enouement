import { db } from "@/lib/db";
import { HeroManager } from "@/components/admin/hero-manager";

export const dynamic = "force-dynamic";

export default async function HeroPage() {
  const rows = await db.heroMedia.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return <HeroManager initial={rows as any} />;
}
