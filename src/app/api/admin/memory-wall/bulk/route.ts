import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one id is required").max(500, "Max 500 ids per bulk action"),
  action: z.enum(["approve", "reject", "delete"]),
});

/**
 * POST /api/admin/memory-wall/bulk
 * Performs a bulk action on a list of memory wall message ids.
 *
 * Body: { ids: string[], action: "approve" | "reject" | "delete" }
 *   approve → status = "APPROVED"
 *   reject  → status = "REJECTED"
 *   delete  → cascade delete the rows
 *
 * All operations are wrapped in a transaction so partial failures roll back.
 */
export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const { ids, action } = parsed.data;

    let count = 0;
    if (action === "delete") {
      const result = await db.memoryWallMessage.deleteMany({ where: { id: { in: ids } } });
      count = result.count;
    } else {
      const status = action === "approve" ? "APPROVED" : "REJECTED";
      const result = await db.memoryWallMessage.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      count = result.count;
    }

    await logAudit("bulk-" + action, "MemoryWallMessage", undefined, {
      count,
      ids: ids.slice(0, 50),
    });
    revalidateTag("memory-wall", "max");
    return ok({ ok: true, count, action });
  });
}

export const _r = NextResponse;
