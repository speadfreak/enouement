import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  order: z.coerce.number().int().min(0).max(100000).default(0),
  visible: z.boolean().default(true),
});

/**
 * GET /api/admin/footer-link-groups
 * Returns all footer link groups with their nested links, ordered by `order`.
 */
export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const groups = await db.footerLinkGroup.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
      include: {
        links: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      },
    });
    return ok(groups);
  });
}

/**
 * POST /api/admin/footer-link-groups
 * Creates a new footer link group.
 */
export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, createSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    // If order isn't explicitly set, append after the last group.
    let order = v.order;
    if (v.order === 0) {
      const last = await db.footerLinkGroup.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (last?.order ?? -1) + 1;
    }

    const created = await db.footerLinkGroup.create({
      data: {
        title: v.title,
        order,
        visible: v.visible,
      },
      include: { links: true },
    });
    await logAudit("create", "FooterLinkGroup", created.id, { title: created.title });
    revalidateTag("footer-links", "max");
    return ok(created, 201);
  });
}

export const _r = NextResponse;
