import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const itemSchema = z.object({
  url: z.string().min(1, "URL is required"),
  type: z.enum(["image", "video"]).default("image"),
  title: z.string().optional().nullable(),
});

const schema = z.object({
  items: z
    .array(itemSchema)
    .min(1, "At least one item is required")
    .max(500, "Too many items (max 500)"),
});

/**
 * Bulk-create media rows for an album in a single DB call. Expects:
 *   { items: [{ url, type, title? }] }
 * Each item is appended after the album's current highest `order` so the
 * new items show up at the end of the album.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleErr(async () => {
    await requireAdmin();
    const { id } = await params;

    // Verify the album exists (404 otherwise).
    const album = await db.album.findUnique({ where: { id } });
    if (!album) return bad("Album not found.", 404);

    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    // Compute the next `order` index for this album.
    const last = await db.media.findFirst({
      where: { albumId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const baseOrder = (last?.order ?? -1) + 1;

    const result = await db.media.createMany({
      data: v.items.map((it, i) => ({
        albumId: id,
        url: it.url,
        type: it.type,
        title: it.title || null,
        order: baseOrder + i,
      })),
    });

    await logAudit("bulk-create", "Media", undefined, {
      albumId: id,
      count: result.count,
    });
    revalidateTag("albums", "max");
    return ok({ created: result.count }, 201);
  });
}

export const _r = NextResponse;
