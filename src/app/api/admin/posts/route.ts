import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  caption: z.string().min(1, "Caption is required"),
  tags: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).default([]),
  mediaUrls: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).default([]),
  mediaType: z.enum(["image", "video", "mixed"]).default("image"),
  pinned: z.boolean().default(false),
  published: z.boolean().default(true),
  authorName: z.string().default("Enouement 2K27"),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.post.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const created = await db.post.create({
      data: {
        caption: v.caption,
        tags: v.tags,
        mediaUrls: v.mediaUrls,
        mediaType: v.mediaType,
        pinned: v.pinned,
        published: v.published,
        authorName: v.authorName,
      },
    });
    await logAudit("create", "Post", created.id, { caption: created.caption });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
