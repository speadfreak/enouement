import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const httpsUrlOptional = z
  .string()
  .optional()
  .refine((u) => !u || (z.string().url().safeParse(u).success && u.startsWith("https://")), {
    message: "Must be an https:// URL",
  });

const schema = z.object({
  devName: z.string().min(1, "Developer name is required").max(120),
  devRole: z.string().max(120).default("Full-Stack Developer"),
  devLink: httpsUrlOptional.nullable(),
});

export async function PUT(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const data = {
      devName: v.devName,
      devRole: v.devRole,
      devLink: v.devLink?.trim() ? v.devLink.trim() : null,
    };

    const updated = await db.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site", ...data },
      update: data,
    });

    await logAudit("update", "SiteSetting", updated.id, {
      devName: updated.devName,
      devRole: updated.devRole,
    });
    return ok({
      devName: updated.devName,
      devRole: updated.devRole,
      devLink: updated.devLink,
    });
  });
}

export const _r = NextResponse;
