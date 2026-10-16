import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody, slugify } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  body: z.string().min(1, "Body is required"),
  coverUrl: z.string().optional().nullable(),
  category: z.string().default("news"),
  pinned: z.boolean().default(false),
  urgent: z.boolean().default(false),
  published: z.boolean().default(true),
  publishAt: z.string().optional().nullable(),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
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
    const created = await db.announcement.create({
      data: {
        title: v.title,
        slug,
        excerpt: v.excerpt || null,
        body: v.body,
        coverUrl: v.coverUrl || null,
        category: v.category,
        pinned: v.pinned,
        urgent: v.urgent,
        published: v.published,
        publishAt: v.publishAt ? new Date(v.publishAt) : new Date(),
      },
    });
    await logAudit("create", "Announcement", created.id, { title: created.title, slug: created.slug });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
