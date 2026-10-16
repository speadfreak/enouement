import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  handled: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const data: Record<string, any> = {};
    if (v.handled !== undefined) data.handled = v.handled;
    const updated = await db.contactMessage.update({ where: { id }, data });
    await logAudit("update", "ContactMessage", updated.id, { handled: updated.handled });
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.contactMessage.delete({ where: { id } });
    await logAudit("delete", "ContactMessage", deleted.id, {});
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
