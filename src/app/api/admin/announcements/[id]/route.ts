import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody, slugify } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  body: z.string().optional(),
  coverUrl: z.string().optional().nullable(),
  category: z.string().optional(),
  pinned: z.boolean().optional(),
  urgent: z.boolean().optional(),
  published: z.boolean().optional(),
  publishAt: z.string().optional().nullable(),
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
    if (v.excerpt !== undefined) data.excerpt = v.excerpt || null;
    if (v.body !== undefined) data.body = v.body;
    if (v.coverUrl !== undefined) data.coverUrl = v.coverUrl || null;
    if (v.category !== undefined) data.category = v.category;
    if (v.pinned !== undefined) data.pinned = v.pinned;
    if (v.urgent !== undefined) data.urgent = v.urgent;
    if (v.published !== undefined) data.published = v.published;
    if (v.publishAt !== undefined) data.publishAt = v.publishAt ? new Date(v.publishAt) : new Date();
    // remove undefined so we don't overwrite with undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const updated = await db.announcement.update({ where: { id }, data });
    await logAudit("update", "Announcement", updated.id, {});
    revalidateTag("announcements", "max");
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.announcement.delete({ where: { id } });
    await logAudit("delete", "Announcement", deleted.id, {});
    revalidateTag("announcements", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
