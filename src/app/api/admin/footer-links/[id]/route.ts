import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const updateSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  href: z.string().min(1).max(500).optional(),
  isNew: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(100000).optional(),
  groupId: z.string().min(1).optional(),
});

/**
 * PUT /api/admin/footer-links/:id
 * Updates one or more fields of a footer link. The `groupId` field can be
 * used to move a link to another group.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, updateSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const data: Record<string, unknown> = {};
    if (v.label !== undefined) data.label = v.label;
    if (v.href !== undefined) data.href = v.href;
    if (v.isNew !== undefined) data.isNew = v.isNew;
    if (v.order !== undefined) data.order = v.order;
    if (v.groupId !== undefined) data.groupId = v.groupId;

    const updated = await db.footerLink.update({ where: { id }, data });
    await logAudit("update", "FooterLink", updated.id, { label: updated.label });
    revalidateTag("footer-links", "max");
    return ok(updated);
  });
}

/**
 * DELETE /api/admin/footer-links/:id
 * Deletes a footer link.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.footerLink.delete({ where: { id } });
    await logAudit("delete", "FooterLink", deleted.id, { label: deleted.label });
    revalidateTag("footer-links", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
