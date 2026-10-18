import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const httpsUrl = z
  .string()
  .url("Must be a valid URL")
  .refine((u) => u.startsWith("https://"), "Only https:// URLs are allowed");

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  tagline: z.string().max(300).optional().nullable(),
  url: httpsUrl.optional(),
  logoUrl: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).max(100000).optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, updateSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const data: Record<string, unknown> = {};
    if (v.title !== undefined) data.title = v.title;
    if (v.tagline !== undefined) data.tagline = v.tagline || null;
    if (v.url !== undefined) data.url = v.url;
    if (v.logoUrl !== undefined) data.logoUrl = v.logoUrl || null;
    if (v.order !== undefined) data.order = v.order;
    if (v.enabled !== undefined) data.enabled = v.enabled;

    const updated = await db.developerLink.update({ where: { id }, data });
    await logAudit("update", "DeveloperLink", updated.id, { title: updated.title });
    revalidateTag("dev-links", "max");
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.developerLink.delete({ where: { id } });
    await logAudit("delete", "DeveloperLink", deleted.id, { title: deleted.title });
    revalidateTag("dev-links", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
