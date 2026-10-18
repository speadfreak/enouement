import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const httpsUrl = z
  .string()
  .min(1, "URL is required")
  .url("Must be a valid URL")
  .refine((u) => u.startsWith("https://"), "Only https:// URLs are allowed");

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  tagline: z.string().max(300).optional().nullable(),
  url: httpsUrl,
  logoUrl: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).max(100000).default(0),
  enabled: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.developerLink.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, createSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;

    const created = await db.developerLink.create({
      data: {
        title: v.title,
        tagline: v.tagline || null,
        url: v.url,
        logoUrl: v.logoUrl || null,
        order: v.order,
        enabled: v.enabled,
      },
    });
    await logAudit("create", "DeveloperLink", created.id, {
      title: created.title,
      url: created.url,
    });
    revalidateTag("dev-links", "max");
    return ok(created, 201);
  });
}

export const _r = NextResponse;
