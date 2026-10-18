import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "At least one id is required")
    .max(500, "Too many ids (max 500)"),
});

/**
 * Bulk-delete media rows scoped to a specific album. The `albumId` is
 * included in the WHERE clause so a malicious or stale id from another
 * album cannot be removed by mistake.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;

    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const result = await db.media.deleteMany({
      where: {
        id: { in: v.ids },
        albumId: id,
      },
    });

    await logAudit("bulk-delete", "Media", undefined, {
      albumId: id,
      count: result.count,
    });
    return ok({ deleted: result.count });
  });
}

export const _r = NextResponse;
