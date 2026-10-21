import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const createSchema = z.object({
  groupId: z.string().min(1, "Group id is required"),
  label: z.string().min(1, "Label is required").max(120),
  href: z.string().min(1, "URL is required").max(500),
  isNew: z.boolean().default(false),
  order: z.coerce.number().int().min(0).max(100000).default(0),
});

/**
 * POST /api/admin/footer-links
 * Creates a new link inside an existing footer link group.
 */
export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, createSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    // Verify the parent group exists (404 otherwise).
    const group = await db.footerLinkGroup.findUnique({ where: { id: v.groupId } });
    if (!group) return bad("Footer link group not found.", 404);

    // If order isn't explicitly set, append after the last link in this group.
    let order = v.order;
    if (v.order === 0) {
      const last = await db.footerLink.findFirst({
        where: { groupId: v.groupId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (last?.order ?? -1) + 1;
    }

    const created = await db.footerLink.create({
      data: {
        groupId: v.groupId,
        label: v.label,
        href: v.href,
        isNew: v.isNew,
        order,
      },
    });
    await logAudit("create", "FooterLink", created.id, {
      label: created.label,
      groupId: created.groupId,
    });
    revalidateTag("footer-links", "max");
    return ok(created, 201);
  });
}

export const _r = NextResponse;
