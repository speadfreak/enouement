import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody, slugify } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  category: z.string().default("special"),
  published: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.event.findMany({
      orderBy: { startDate: "asc" },
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
    const slug = (v.slug && v.slug.trim()) || slugify(v.title);
    const created = await db.event.create({
      data: {
        title: v.title,
        slug,
        description: v.description || null,
        body: v.body || null,
        coverUrl: v.coverUrl || null,
        location: v.location || null,
        startDate: new Date(v.startDate),
        endDate: v.endDate ? new Date(v.endDate) : null,
        category: v.category,
        published: v.published,
      },
    });
    await logAudit("create", "Event", created.id, { title: created.title, slug: created.slug });
    revalidateTag("events", "max");
    return ok(created, 201);
  });
}

export const _r = NextResponse;
