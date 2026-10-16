import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleErr, ok } from "@/lib/admin-route";

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(rows);
  });
}

export const _r = NextResponse;
