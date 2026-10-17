import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
  futurePlan: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  stream: z
    .union([z.literal("Natural"), z.literal("Social"), z.null(), z.literal("")])
    .optional(),
  club: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export async function GET(req: Request) {
  return handleErr(async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(
      500,
      Math.max(1, Number(url.searchParams.get("pageSize") || "25") || 25)
    );
    const q = (url.searchParams.get("q") || "").trim();
    const stream = url.searchParams.get("stream") || ""; // "" | "Natural" | "Social" | "none"
    const published = url.searchParams.get("published") || ""; // "" | "true" | "false"
    const featured = url.searchParams.get("featured") || ""; // "" | "true" | "false"

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { nickname: { contains: q, mode: "insensitive" } },
        { section: { contains: q, mode: "insensitive" } },
        { club: { contains: q, mode: "insensitive" } },
      ];
    }
    if (stream === "Natural" || stream === "Social") {
      where.stream = stream;
    } else if (stream === "none") {
      where.stream = null;
    }
    if (published === "true") where.published = true;
    else if (published === "false") where.published = false;
    if (featured === "true") where.featured = true;
    else if (featured === "false") where.featured = false;

    const [items, total] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.student.count({ where }),
    ]);

    // stats — computed on the full set (ignores filters/pagination)
    const [
      totalCount,
      publishedCount,
      naturalCount,
      socialCount,
      withPhotoCount,
    ] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { published: true } }),
      db.student.count({ where: { stream: "Natural" } }),
      db.student.count({ where: { stream: "Social" } }),
      db.student.count({ where: { NOT: { photoUrl: null } } }),
    ]);

    return ok({
      items,
      total,
      page,
      pageSize,
      stats: {
        total: totalCount,
        published: publishedCount,
        natural: naturalCount,
        social: socialCount,
        withPhoto: withPhotoCount,
      },
    });
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const created = await db.student.create({
      data: {
        name: v.name,
        nickname: v.nickname || null,
        photoUrl: v.photoUrl || null,
        quote: v.quote || null,
        futurePlan: v.futurePlan || null,
        section: v.section || null,
        stream:
          v.stream === "Natural" || v.stream === "Social" ? v.stream : null,
        club: v.club || null,
        order: v.order,
        featured: v.featured,
        published: v.published,
      },
    });
    await logAudit("create", "Student", created.id, { name: created.name });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
