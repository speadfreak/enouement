import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  headline: z.string().min(1, "Headline is required"),
  intro: z.string().optional(),
  countdownDate: z.string().optional().nullable(),
  program: z.string().optional().default("[]"),
  thankYouText: z.string().optional().nullable(),
  memoriesGallery: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).optional().default([]),
});

function safeJson(s: string | undefined, fallback: any) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const g = await db.graduationContent.findUnique({ where: { id: "graduation" } });
    return ok(g ?? { id: "graduation" });
  });
}

export async function PUT(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const data = {
      headline: v.headline,
      intro: v.intro ?? "",
      countdownDate: v.countdownDate ? new Date(v.countdownDate) : null,
      program: safeJson(v.program, []),
      thankYouText: v.thankYouText || null,
      memoriesGallery: v.memoriesGallery,
    };
    const updated = await db.graduationContent.upsert({
      where: { id: "graduation" },
      create: { id: "graduation", ...data },
      update: data,
    });
    await logAudit("update", "GraduationContent", updated.id, { headline: updated.headline });
    revalidateTag("graduation", "max");
    return ok(updated);
  });
}

export const _r = NextResponse;
