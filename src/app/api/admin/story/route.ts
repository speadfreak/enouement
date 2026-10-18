import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().nullable(),
  body: z.string().min(1, "Body is required"),
  coverUrl: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.storyChapter.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const created = await db.storyChapter.create({
      data: {
        title: v.title,
        subtitle: v.subtitle || null,
        body: v.body,
        coverUrl: v.coverUrl || null,
        year: v.year || null,
        order: v.order,
        published: v.published,
      },
    });
    await logAudit("create", "StoryChapter", created.id, { title: created.title });
    revalidateTag("story", "max");
    return ok(created, 201);
  });
}

export const _r = NextResponse;
