import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const updateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

/**
 * PUT /api/admin/memory-wall/:id
 * Updates the status of a memory wall message (approve/reject).
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, updateSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const data: Record<string, unknown> = {};
    if (v.status !== undefined) data.status = v.status;

    const updated = await db.memoryWallMessage.update({ where: { id }, data });
    await logAudit("update", "MemoryWallMessage", updated.id, {
      status: updated.status,
      name: updated.name,
    });
    revalidateTag("memory-wall", "max");
    return ok(updated);
  });
}

/**
 * DELETE /api/admin/memory-wall/:id
 * Permanently deletes a memory wall message.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const deleted = await db.memoryWallMessage.delete({ where: { id } });
    await logAudit("delete", "MemoryWallMessage", deleted.id, {
      name: deleted.name,
      status: deleted.status,
    });
    revalidateTag("memory-wall", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
