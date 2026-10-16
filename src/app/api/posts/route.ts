import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Item = {
  id: string;
  caption: string;
  tags: string[];
  mediaUrls: string[];
  mediaType: string;
  pinned: boolean;
  published: boolean;
  authorName: string;
  likeCount: number;
  createdAt: Date;
};

function serialize(item: Item) {
  return {
    id: item.id,
    caption: item.caption,
    tags: item.tags,
    mediaUrls: item.mediaUrls,
    mediaType: item.mediaType,
    pinned: item.pinned,
    published: item.published,
    authorName: item.authorName,
    likeCount: item.likeCount,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);

    const items = await db.post.findMany({
      where: { published: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const nextCursor = items.length > limit ? items[items.length - 1].id : null;
    return NextResponse.json({
      items: items.slice(0, limit).map(serialize),
      nextCursor,
    });
  } catch (err) {
    console.error("[/api/posts] error", err);
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 }
    );
  }
}
