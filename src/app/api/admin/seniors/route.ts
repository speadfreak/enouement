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
  club: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.student.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      take: 500,
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
    const created = await db.student.create({
      data: {
        name: v.name,
        nickname: v.nickname || null,
        photoUrl: v.photoUrl || null,
        quote: v.quote || null,
        futurePlan: v.futurePlan || null,
        section: v.section || null,
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
