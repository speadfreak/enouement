import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  category: z.string().optional(),
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
    if (v.description !== undefined) data.description = v.description || null;
    if (v.coverUrl !== undefined) data.coverUrl = v.coverUrl || null;
    if (v.category !== undefined) data.category = v.category;
    if (v.order !== undefined) data.order = v.order;
    if (v.published !== undefined) data.published = v.published;
    const updated = await db.album.update({ where: { id }, data });
    await logAudit("update", "Album", updated.id, {});
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.album.delete({ where: { id } });
    await logAudit("delete", "Album", deleted.id, {});
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
