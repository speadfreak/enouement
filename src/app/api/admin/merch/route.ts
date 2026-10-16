import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  imageUrls: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).default(""),
  colors: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).default(""),
  sizes: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).default(""),
  details: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const rows = await db.merchItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const created = await db.merchItem.create({
      data: {
        name: v.name,
        description: v.description || null,
        price: v.price ?? null,
        imageUrls: v.imageUrls,
        colors: v.colors,
        sizes: v.sizes,
        details: v.details || null,
        featured: v.featured,
        order: v.order,
      },
    });
    await logAudit("create", "MerchItem", created.id, { name: created.name });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
