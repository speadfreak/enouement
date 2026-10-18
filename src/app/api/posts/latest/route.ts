import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Lightweight "is there anything new?" endpoint for the live moments feed.
 *
 * Returns ONLY the latest post's id + createdAt + the total published count.
 * The client polls this every 15s (when visible) and only refetches the
 * full list at /api/posts if these signatures change — this keeps the
 * polling payload tiny (~80 bytes vs ~50 KB for the full first page).
 */
export async function GET() {
  try {
    const [latest, count] = await Promise.all([
      db.post.findFirst({
        where: { published: true },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        select: { id: true, createdAt: true, pinned: true },
      }),
      db.post.count({ where: { published: true } }),
    ]);

    return NextResponse.json(
      {
        latestId: latest?.id ?? null,
        latestCreatedAt: latest?.createdAt.toISOString() ?? null,
        latestPinned: latest?.pinned ?? false,
        count,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=10, stale-while-revalidate=20, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[/api/posts/latest] error", err);
    return NextResponse.json(
      { error: "Failed to load latest post" },
      { status: 500 }
    );
  }
}
