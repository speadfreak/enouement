import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional().nullable(),
  body: z.string().optional(),
  coverUrl: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  order: z.coerce.number().int().optional(),
  published: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const data: Record<string, any> = {};
    if (v.title !== undefined) data.title = v.title;
    if (v.subtitle !== undefined) data.subtitle = v.subtitle || null;
    if (v.body !== undefined) data.body = v.body;
    if (v.coverUrl !== undefined) data.coverUrl = v.coverUrl || null;
    if (v.year !== undefined) data.year = v.year || null;
    if (v.order !== undefined) data.order = v.order;
    if (v.published !== undefined) data.published = v.published;
    const updated = await db.storyChapter.update({ where: { id }, data });
    await logAudit("update", "StoryChapter", updated.id, {});
    revalidateTag("story", "max");
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.storyChapter.delete({ where: { id } });
    await logAudit("delete", "StoryChapter", deleted.id, {});
    revalidateTag("story", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
