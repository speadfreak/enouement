import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  caption: z.string().min(1).optional(),
  tags: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).optional(),
  mediaUrls: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).optional(),
  mediaType: z.enum(["image", "video", "mixed"]).optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  authorName: z.string().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const data: Record<string, any> = {};
    if (v.caption !== undefined) data.caption = v.caption;
    if (v.tags !== undefined) data.tags = v.tags;
    if (v.mediaUrls !== undefined) data.mediaUrls = v.mediaUrls;
    if (v.mediaType !== undefined) data.mediaType = v.mediaType;
    if (v.pinned !== undefined) data.pinned = v.pinned;
    if (v.published !== undefined) data.published = v.published;
    if (v.authorName !== undefined) data.authorName = v.authorName;
    const updated = await db.post.update({ where: { id }, data });
    await logAudit("update", "Post", updated.id, {});
    revalidateTag("posts", "max");
    revalidateTag("stats", "max");
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.post.delete({ where: { id } });
    await logAudit("delete", "Post", deleted.id, {});
    revalidateTag("posts", "max");
    revalidateTag("stats", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
