import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  url: z.string().min(1, "URL is required"),
  posterUrl: z.string().optional().nullable(),
  category: z.string().default("event"),
  duration: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.video.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 200,
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
    const created = await db.video.create({
      data: {
        title: v.title,
        description: v.description || null,
        url: v.url,
        posterUrl: v.posterUrl || null,
        category: v.category,
        duration: v.duration || null,
        featured: v.featured,
        published: v.published,
      },
    });
    await logAudit("create", "Video", created.id, { title: created.title });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
