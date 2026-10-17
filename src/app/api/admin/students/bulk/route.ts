import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const studentRow = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  stream: z
    .union([z.literal("Natural"), z.literal("Social"), z.null(), z.literal("")])
    .optional(),
  club: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
  futurePlan: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

const schema = z.object({
  students: z
    .array(studentRow)
    .min(1, "At least one student required")
    .max(1000, "Max 1000 per batch"),
});

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const { students } = parsed.data;

    const rows = students.map((s, i) => ({
      name: s.name,
      nickname: s.nickname || null,
      section: s.section || null,
      stream:
        s.stream === "Natural" || s.stream === "Social"
          ? s.stream
          : (null as string | null),
      club: s.club || null,
      quote: s.quote || null,
      futurePlan: s.futurePlan || null,
      photoUrl: s.photoUrl || null,
      order: i,
      featured: false,
      published: true,
    }));

    const result = await db.student.createMany({ data: rows });
    await logAudit("bulk-create", "Student", undefined, { count: result.count });
    return ok({ created: result.count }, 201);
  });
}

export const _r = NextResponse;
