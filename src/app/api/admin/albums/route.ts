import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  category: z.string().default("events"),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.album.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { order: "asc" } } },
    });
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const created = await db.album.create({
      data: {
        title: v.title,
        description: v.description || null,
        coverUrl: v.coverUrl || null,
        category: v.category,
        order: v.order,
        published: v.published,
      },
    });
    await logAudit("create", "Album", created.id, { title: created.title });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
