import { db } from "@/lib/db";
import { PostsManager } from "@/components/admin/posts-manager";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const rows = await db.post.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return <PostsManager initial={rows as any} />;
}
