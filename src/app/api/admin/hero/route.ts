import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  type: z.enum(["image", "video"]).default("image"),
  url: z.string().min(1, "URL is required"),
  posterUrl: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  duration: z.coerce.number().int().min(500).max(60000).default(6000),
  transition: z.enum(["fade", "zoom", "slide"]).default("fade"),
  order: z.coerce.number().int().default(0),
  enabled: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.heroMedia.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const data = parsed.data;
    const created = await db.heroMedia.create({
      data: {
        type: data.type,
        url: data.url,
        posterUrl: data.posterUrl || null,
        title: data.title || null,
        duration: data.duration,
        transition: data.transition,
        order: data.order,
        enabled: data.enabled,
      },
    });
    await logAudit("create", "HeroMedia", created.id, { title: created.title, url: created.url });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
