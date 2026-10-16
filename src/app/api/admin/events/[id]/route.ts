import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody, slugify } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  category: z.string().optional(),
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
    if (v.slug !== undefined) data.slug = v.slug.trim() ? slugify(v.slug) : undefined;
    if (v.description !== undefined) data.description = v.description || null;
    if (v.body !== undefined) data.body = v.body || null;
    if (v.coverUrl !== undefined) data.coverUrl = v.coverUrl || null;
    if (v.location !== undefined) data.location = v.location || null;
    if (v.startDate !== undefined) data.startDate = new Date(v.startDate);
    if (v.endDate !== undefined) data.endDate = v.endDate ? new Date(v.endDate) : null;
    if (v.category !== undefined) data.category = v.category;
    if (v.published !== undefined) data.published = v.published;
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const updated = await db.event.update({ where: { id }, data });
    await logAudit("update", "Event", updated.id, {});
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.event.delete({ where: { id } });
    await logAudit("delete", "Event", deleted.id, {});
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
