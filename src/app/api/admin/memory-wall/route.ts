import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleErr, ok, bad } from "@/lib/admin-route";

const statusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const querySchema = z.object({
  status: statusEnum.optional(),
});

/**
 * GET /api/admin/memory-wall?status=PENDING
 * Returns all memory wall messages, optionally filtered by status.
 *
 * The rows are returned with createdAt desc; the manager reorders them so
 * PENDING appears first, then APPROVED, then REJECTED.
 */
export async function GET(req: Request) {
  return handleErr(async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const rawStatus = url.searchParams.get("status") ?? undefined;
    const parsed = querySchema.safeParse({ status: rawStatus });
    if (!parsed.success) {
      return bad("Invalid status filter. Use PENDING | APPROVED | REJECTED.", 422);
    }

    const where = parsed.data.status ? { status: parsed.data.status } : undefined;

    const rows = await db.memoryWallMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return ok(rows);
  });
}

export const _r = NextResponse;
