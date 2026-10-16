import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  url: z.string().min(1).optional(),
  posterUrl: z.string().optional().nullable(),
  category: z.string().optional(),
  duration: z.string().optional().nullable(),
  featured: z.boolean().optional(),
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
    if (v.description !== undefined) data.description = v.description || null;
    if (v.url !== undefined) data.url = v.url;
    if (v.posterUrl !== undefined) data.posterUrl = v.posterUrl || null;
    if (v.category !== undefined) data.category = v.category;
    if (v.duration !== undefined) data.duration = v.duration || null;
    if (v.featured !== undefined) data.featured = v.featured;
    if (v.published !== undefined) data.published = v.published;
    const updated = await db.video.update({ where: { id }, data });
    await logAudit("update", "Video", updated.id, {});
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.video.delete({ where: { id } });
    await logAudit("delete", "Video", deleted.id, {});
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
