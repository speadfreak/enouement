import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  type: z.enum(["image", "video"]).optional(),
  url: z.string().min(1).optional(),
  posterUrl: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  duration: z.coerce.number().int().min(500).max(60000).optional(),
  transition: z.enum(["fade", "zoom", "slide"]).optional(),
  order: z.coerce.number().int().optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const data: Record<string, any> = {};
    if (v.type !== undefined) data.type = v.type;
    if (v.url !== undefined) data.url = v.url;
    if (v.posterUrl !== undefined) data.posterUrl = v.posterUrl || null;
    if (v.title !== undefined) data.title = v.title || null;
    if (v.duration !== undefined) data.duration = v.duration;
    if (v.transition !== undefined) data.transition = v.transition;
    if (v.order !== undefined) data.order = v.order;
    if (v.enabled !== undefined) data.enabled = v.enabled;

    const updated = await db.heroMedia.update({ where: { id }, data });
    await logAudit("update", "HeroMedia", updated.id, { title: updated.title });
    revalidateTag("hero", "max");
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.heroMedia.delete({ where: { id } });
    await logAudit("delete", "HeroMedia", deleted.id, {});
    revalidateTag("hero", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
