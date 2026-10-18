import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  url: z.string().min(1, "URL is required"),
  type: z.enum(["image", "video"]).default("image"),
  title: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const media = await db.media.findMany({
      where: { albumId: id },
      orderBy: { order: "asc" },
    });
    return ok(media);
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const created = await db.media.create({
      data: {
        albumId: id,
        url: v.url,
        type: v.type,
        title: v.title || null,
        order: v.order,
      },
    });
    await logAudit("create", "Media", created.id, { albumId: id });
    revalidateTag("albums", "max");
    return ok(created, 201);
  });
}

export const _r = NextResponse;
