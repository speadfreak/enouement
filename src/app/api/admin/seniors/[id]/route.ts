import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  name: z.string().min(1).optional(),
  nickname: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
  futurePlan: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  club: z.string().optional().nullable(),
  order: z.coerce.number().int().optional(),
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
    if (v.name !== undefined) data.name = v.name;
    if (v.nickname !== undefined) data.nickname = v.nickname || null;
    if (v.photoUrl !== undefined) data.photoUrl = v.photoUrl || null;
    if (v.quote !== undefined) data.quote = v.quote || null;
    if (v.futurePlan !== undefined) data.futurePlan = v.futurePlan || null;
    if (v.section !== undefined) data.section = v.section || null;
    if (v.club !== undefined) data.club = v.club || null;
    if (v.order !== undefined) data.order = v.order;
    if (v.featured !== undefined) data.featured = v.featured;
    if (v.published !== undefined) data.published = v.published;
    const updated = await db.student.update({ where: { id }, data });
    await logAudit("update", "Student", updated.id, {});
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.student.delete({ where: { id } });
    await logAudit("delete", "Student", deleted.id, {});
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
