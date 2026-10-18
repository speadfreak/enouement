import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok } from "@/lib/admin-route";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id, mediaId } = await params;
    const deleted = await db.media.delete({ where: { id: mediaId } });
    await logAudit("delete", "Media", deleted.id, { albumId: id });
    revalidateTag("albums", "max");
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
