import { db } from "@/lib/db";
import { StoryManager } from "@/components/admin/story-manager";

export const dynamic = "force-dynamic";

export default async function StoryPage() {
  const rows = await db.storyChapter.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return <StoryManager initial={rows as any} />;
}
