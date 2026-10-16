import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  imageUrls: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).optional(),
  colors: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).optional(),
  sizes: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).optional(),
  details: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
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
    if (v.description !== undefined) data.description = v.description || null;
    if (v.price !== undefined) data.price = v.price ?? null;
    if (v.imageUrls !== undefined) data.imageUrls = v.imageUrls;
    if (v.colors !== undefined) data.colors = v.colors;
    if (v.sizes !== undefined) data.sizes = v.sizes;
    if (v.details !== undefined) data.details = v.details || null;
    if (v.featured !== undefined) data.featured = v.featured;
    if (v.order !== undefined) data.order = v.order;
    const updated = await db.merchItem.update({ where: { id }, data });
    await logAudit("update", "MerchItem", updated.id, {});
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.merchItem.delete({ where: { id } });
    await logAudit("delete", "MerchItem", deleted.id, {});
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
