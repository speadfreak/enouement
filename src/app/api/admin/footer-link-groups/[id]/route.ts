import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const updateSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  order: z.coerce.number().int().min(0).max(100000).optional(),
  visible: z.boolean().optional(),
});

/**
 * PUT /api/admin/footer-link-groups/:id
 * Updates one or more fields of a footer link group.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, updateSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const data: Record<string, unknown> = {};
    if (v.title !== undefined) data.title = v.title;
    if (v.order !== undefined) data.order = v.order;
    if (v.visible !== undefined) data.visible = v.visible;

    const updated = await db.footerLinkGroup.update({
      where: { id },
      data,
      include: { links: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    });
    await logAudit("update", "FooterLinkGroup", updated.id, { title: updated.title });
    revalidateTag("footer-links", "max");
    return ok(updated);
  });
}

/**
 * DELETE /api/admin/footer-link-groups/:id
 * Deletes a group and cascades to its links ( onDelete: Cascade ).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.footerLinkGroup.delete({ where: { id } });
    await logAudit("delete", "FooterLinkGroup", deleted.id, { title: deleted.title });
    revalidateTag("footer-links", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
